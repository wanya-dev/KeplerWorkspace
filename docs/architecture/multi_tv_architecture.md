# Multi-TV Cross-Platform Architecture

> Google TV + Vega OS + Tizen TV 跨平台应用架构方案

> 配套文档：[开发指南](../development.md)（代码结构 + 踩坑） · [部署指南](../deployment.md)（构建/签名/部署）

## 1. 项目目标

在 **Google TV (Android TV)**、**Amazon Vega OS (Fire TV)** 和 **Tizen TV** 上开发应用，最大化代码复用，同时保留各平台原生能力。

### 两个 runtime 家族（核心心智模型）

平台按 **runtime** 分两类，新设备先归类、再复用，不要按品牌单独造：

| 家族 | 成员 | Runtime | Bundler |
|------|------|---------|---------|
| **RN 原生** | Google TV、Vega OS | RN bridge | Metro |
| **Web / DOM** | Tizen TV（未来 TiVo OS） | 浏览器引擎 + react-native-web | Vite |

### 核心约束

| 约束 | 影响 |
|------|------|
| Vega OS **只支持 React Native** (0.72.0) | 框架选型锁定为 RN |
| Google TV 可用 Kotlin/Compose 或 RN | 为了代码复用，选择 RN (react-native-tvos 0.72.6-1) |
| 两端 RN 版本必须兼容 | shared 包不能使用 > 0.72 的 API |
| Tizen 只能跑 Web | 通过 react-native-web 复用 RN 代码；UI 须 web 安全（见开发指南坑 #1/#2） |
| 系统级应用需要原生能力 | 通过 PAL + Native Module / Web API 桥接 |

---

## 2. Monorepo 架构

```
KeplerWorkspace/
├── package.json              ← Yarn 1 workspaces + nohoist
├── packages/
│   └── shared/               ← 共享层：UI + 业务逻辑 + PAL 接口
│       ├── index.ts
│       └── src/
│           ├── pal/           ← Platform Abstraction Layer 接口
│           ├── screens/       ← 共享页面组件
│           ├── components/    ← 共享 UI 组件
│           ├── data/          ← 数据模型
│           ├── services/      ← HTTP Client 等通用服务
│           ├── utils/         ← 工具函数 (scaling 等)
│           └── assets/        ← 图片、动画资源
├── apps/
│   ├── vega/                  ← Vega OS 应用
│   │   ├── src/
│   │   │   ├── App.tsx        ← 注入 Vega PAL
│   │   │   └── pal/           ← Vega PAL 实现
│   │   ├── metro.config.js    ← monorepo-tools 自动配置
│   │   └── package.json
│   └── google-tv/             ← Google TV 应用
│       ├── src/
│       │   ├── App.tsx        ← 注入 Android PAL
│       │   └── pal/           ← Android PAL 实现
│       ├── android/           ← Android 原生工程
│       │   └── app/src/main/java/com/keplerandroidtv/
│       │       ├── MainActivity.java
│       │       ├── MainApplication.java
│       │       ├── SystemServiceModule.java    ← Native Module
│       │       └── SystemServicePackage.java
│       ├── metro.config.js
│       └── package.json
└── docs/
    └── architecture/          ← 本文档
```

### 依赖管理策略

采用 Amazon 官方推荐的 **全局 nohoist** + **react-native-monorepo-tools**：

```json
// 根 package.json
{
  "workspaces": {
    "packages": ["packages/*", "apps/*"],
    "nohoist": [
      "**/react",
      "**/react-dom",
      "**/react-native",
      "**/react-native/**"
    ]
  }
}
```

**效果**：每个 app 的 `react` 和 `react-native` 独立安装在自己的 `node_modules` 中，避免双实例冲突。

**Metro 配置**：使用 `react-native-monorepo-tools` 自动生成 `watchFolders` 和 `blockList`，不需要手写正则。

---

## 3. PAL (Platform Abstraction Layer)

### 3.1 设计原则

```
┌──────────────────────────────────────────────────┐
│              packages/shared                      │
│                                                   │
│  UI 组件 / 页面 / 业务逻辑                         │
│       │                                           │
│       ▼                                           │
│  ┌─────────────────────────────────────────────┐  │
│  │         PAL Interfaces (TypeScript)          │  │
│  │  ISystemService · IMediaPlayer · IVoiceService│ │
│  └─────────────────────────────────────────────┘  │
│       ▲  usePal() via React Context               │
├───────┼──────────────────┬────────────────────────┤
│       │                  │                        │
│  apps/vega              apps/google-tv            │
│  VegaPAL impl           AndroidPAL impl           │
│  (JS / Kepler API)      (NativeModules → Java)    │
└──────────────────────────┴────────────────────────┘
```

- **依赖反转**：shared 只依赖接口，不依赖任何平台实现
- **编译时类型检查**：新增接口方法，两端未实现则编译报错
- **可测试**：Mock PAL 即可单元测试所有业务逻辑
- **框架无关**：迁移到 Expo TV 时，接口不变，只换实现

### 3.2 接口定义

```typescript
// packages/shared/src/pal/interfaces.ts

export interface ISystemService {
  getDeviceId(): Promise<string>;
  getSystemVolume(): Promise<number>;    // 0-100
  showToast(message: string): void;
  notifyContentReady(contentId: string): void;
}

export interface IMediaPlayer {
  play(url: string, drmConfig?: DRMConfig): Promise<void>;
  pause(): void;
  seek(positionMs: number): void;
  stop(): void;
  getCurrentPosition(): Promise<number>;
  getDuration(): Promise<number>;
}

export interface IVoiceService {
  startListening(): Promise<void>;
  stopListening(): void;
  onCommand(handler: (cmd: string) => void): void;
}

// 注入容器
export interface PlatformServices {
  system: ISystemService;
  player: IMediaPlayer;
  voice: IVoiceService;
}
```

### 3.3 注入方式

```typescript
// 各 App 入口
import {PalProvider} from '@workspace/shared';
import {androidPalServices} from './pal';  // 或 vegaPalServices

export const App = () => (
  <PalProvider services={androidPalServices}>
    <HomeScreen />
  </PalProvider>
);

// shared 业务代码消费
const {system} = usePal();
const volume = await system.getSystemVolume();
system.showToast(`Volume: ${volume}%`);
```

### 3.4 各平台实现对照

| PAL 接口 | Google TV 实现 | Vega 实现 |
|----------|---------------|-----------|
| `getSystemVolume()` | `AudioManager.getStreamVolume()` via Native Module | Kepler Audio API (待桥接，当前返回模拟值) |
| `showToast()` | `Toast.makeText()` via Native Module | `Alert.alert()` 降级 |
| `getDeviceId()` | `Settings.Secure.ANDROID_ID` | `KeplerDeviceInfo` 模块 |
| `notifyContentReady()` | Google Watch Next Provider | Amazon Catalog API |
| `play()` | ExoPlayer via Native Module | VegaPlayer / MSE+EME |

---

## 4. 构建与部署

### 4.1 脚本体系

采用 **yarn workspace 委托模式**（与 Amazon 官方项目一致）：

```json
// 根 package.json — 只做转发
{
  "scripts": {
    "vega:build":       "yarn workspace @amazon-devices/keplerproject run build:release",
    "vega:vvd:intel":   "yarn workspace @amazon-devices/keplerproject run vvd:intel",
    "android:deploy":   "yarn workspace @workspace/google-tv run deploy",
    "sim:start":        "vega virtual-device start"
  }
}
```

复杂逻辑放在子包的 scripts 中，根只做委托。

### 4.2 平台构建流程

**Vega OS：**
```
yarn vega:build        → react-native build-vega → .vpkg
yarn sim:start         → 启动虚拟设备
yarn vega:vvd:intel    → vega run-app → 部署到模拟器
```

**Google TV (Android TV)：**
```
yarn android:deploy        → gradlew installRelease → ADB 部署 → 启动 Activity
yarn android:deploy:clean  → 清理 → 全量构建 → 部署
```

**Tizen TV（Web 家族）：**
```
yarn tizen:dev       → vite dev server（浏览器实时预览）
yarn tizen:package   → vite build + 签名 → .wgt
```
详细签名/部署见 [部署指南](../deployment.md) §3。

---

## 4.5 Web 家族（Tizen / TiVo OS）

RN 原生家族（vega/google-tv）和 Web 家族（tizen）共享同一套 PAL 接口与业务逻辑，
但渲染与打包链路不同：

| 维度 | RN 原生家族 | Web 家族 |
|------|-------------|----------|
| 渲染 | RN bridge → 原生视图 | react-native-web → DOM |
| Bundler | Metro | Vite |
| 资源 | `require('x.png')` | ESM `import x.png` |
| 平台分支 | `.kepler/.android` 后缀 | `.web` 后缀 + **PAL 注入** |
| 打包 | `.vpkg` / `.apk` | 签名 `.wgt` |

**Web 家族内部如何区分平台**：Tizen 与未来 TiVo OS 在 react-native-web 里
`Platform.OS` 都是 `'web'`，**无法用 `.web` 后缀或 `Platform.select` 区分**。
两者差异（系统 API、遥控键码、打包格式）一律收敛到 **PAL 注入** + **各自薄壳**，
UI 完全不感知。

**TiVo 接入定位**：
- TiVo Stream 4K / Android 系 TiVo → 归 **RN 原生家族**，复用 react-native-tvos，≈ 零成本。
- TiVo OS（智能电视 web 平台，RDK/HTML5）→ 归 **Web 家族**，与 Tizen 同链路，
  增量 ≈ 一份 PAL 实现 + 一份打包配置。

**当前共享现状**：Tizen 目前 fork 了 `WebHomeScreen`（只共享 PAL 接口 + 图片），
UI 独立维护。根治方向是把 shared UI 改成 web 安全（拆 barrel + ESM 资源 +
`HomeScreen.web.tsx` 分支），实现"三端一套 UI"。详见 [开发指南](../development.md) §1/§3。

---

## 5. 已解决的关键问题

| 问题 | 根因 | 解决方案 |
|------|------|---------|
| React 双实例崩溃 (`useState of null`) | nohoist 不完整，shared 和 app 使用不同 React 实例 | 全局 nohoist `**/react`, `**/react-native` |
| Metro blockList 手写正则易错 | 手动维护正则，monorepo 变化时遗漏 | `react-native-monorepo-tools` 自动生成 |
| Android TV 焦点切换闪烁 | `onBlur` 同步重置状态，blur/focus 分帧派发 | `onBlur` 改为 no-op，仅由 `onFocus` 驱动状态 |
| Metro 端口 8081 冲突 | 两个 app 共用端口 | 脚本自动 kill 旧进程 |
| Tizen 白屏（无报错） | 从 shared barrel import 拖入原生屏的顶层 `require('x.png')`，浏览器 ESM 下 `require` 不存在 | Web 端改从 `@workspace/shared/src/pal` 子路径 import；根治为拆 barrel |
| Tizen 装上后黑屏 | `.wgt` 经 `file://` 加载，ES module 脚本走 CORS 被拒 | vite 插件把脚本改写为经典 `<script defer>` |
| 未签名 `.wgt` 静默生成 | `tizen package` 缺 profile 时仍退出码 0 | 打包脚本解压校验 `author-signature.xml` |

> Tizen 相关坑的完整复现与修复见 [开发指南](../development.md) §3。

### Vega vs Android TV 焦点差异

| 维度 | Vega (Kepler) | Android TV (react-native-tvos) |
|------|---------------|-------------------------------|
| 事件调度 | blur/focus **同步批处理** | blur/focus **异步分帧派发** |
| 结果 | 一次渲染，无闪烁 | 两次渲染，中间插入一帧 |
| 修复 | 不需要 | onBlur no-op，消除竞态 |

---

## 6. 混合开发策略 (Android 原生页面)

**模式：RN 为主体，通过 PAL 跳转到原生 Activity**

```
[RN HomeScreen] ──PAL.openNativeScreen()──→ [Native SettingsActivity]
                ←────── finish ────────────  [Native PlayerActivity]
```

### PAL 导航接口 (待实现)

```typescript
export interface INavigationService {
  openNativeScreen(route: string, params?: Record<string, unknown>): void;
}
```

- **Android TV**：通过 Intent 启动原生 Activity（Kotlin/Compose）
- **Vega**：用 RN 页面模拟（React Navigation）
- **shared 层不知道"对面"是原生还是 RN**

适用场景：
- ✅ 视频播放器（ExoPlayer Activity）
- ✅ 系统设置页面（Leanback PreferenceFragment）
- ✅ EPG 频道浏览（Leanback BrowseFragment）

---

## 7. 未来迁移路径

### 7.1 Expo TV 迁移

```
                现在                          未来
           Raw RN 0.72               Expo TV (RN 0.81+)
┌────────────────────────┐    ┌────────────────────────┐
│  shared (PAL 接口)      │ =  │  shared (PAL 接口)      │  ← 不变
│  shared (UI + 业务)     │ =  │  shared (UI + 业务)     │  ← 不变
├────────────────────────┤    ├────────────────────────┤
│  NativeModules.X       │ →  │  ExpoModules.X         │  ← 只改这层
│  Java ReactModule      │ →  │  Kotlin ExpoModule     │  ← 只改这层
└────────────────────────┘    └────────────────────────┘
```

**PAL 接口层零改动**，只需更换实现层的 Native Module 写法。

### 7.2 新平台扩展

如果需要支持 Apple TV (tvOS)：

1. 新增 `apps/apple-tv/`
2. 实现 `apps/apple-tv/src/pal/index.ts`（调 Objective-C/Swift 模块）
3. shared 层**一行不改**

---

## 8. 代码复用率分析

```
┌─────────────────────────────────────────────────────────┐
│  packages/shared/          → 100% 共享                   │
│  ├── pal/interfaces.ts     → PAL 接口定义                │
│  ├── pal/PalProvider.tsx   → DI 容器                     │
│  ├── screens/              → 页面组件                    │
│  ├── components/           → UI 组件                     │
│  ├── data/                 → 数据模型                    │
│  ├── services/             → HTTP Client                │
│  └── utils/                → 工具函数                    │
├─────────────────────────────────────────────────────────┤
│  apps/*/src/pal/           → 各平台独立 (~15%)            │
│  apps/*/src/App.tsx        → 入口 + PAL 注入 (~2%)        │
│  apps/google-tv/android/   → Android Native Module (~3%)  │
└─────────────────────────────────────────────────────────┘

预期代码复用率: ~80%
```

---

## 9. 技术栈总览

| 层 | 技术 |
|---|---|
| 共享 UI | React Native 0.72 + TypeScript |
| 共享状态 | React Context (PAL), useState/useCallback |
| Vega Runtime | Kepler OS + react-native 0.72.0 |
| Android Runtime | react-native-tvos 0.72.6-1 |
| Android Native | Java (当前) → Kotlin (计划) |
| Monorepo | Yarn 1 workspaces + nohoist |
| Metro 隔离 | react-native-monorepo-tools |
| 构建 Vega | react-native build-vega → .vpkg |
| 构建 Android | Gradle → .apk |
| 未来框架 | Expo TV (兼容 PAL 架构) |
