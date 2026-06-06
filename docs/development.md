# 开发指南（Code & Gotchas）

面向后续维护者：代码怎么组织、共享边界在哪、以及踩过的坑（重点）。
架构层面见 [architecture/multi_tv_architecture.md](architecture/multi_tv_architecture.md)；部署见 [deployment.md](deployment.md)。

---

## 1. 仓库结构与共享边界

```
KeplerWorkspace/
├── packages/shared/        ← 共享层（UI + 业务 + PAL 接口）
│   ├── index.ts            ← barrel 入口（⚠️ 见下方坑 #1）
│   └── src/
│       ├── pal/            ← 平台抽象层：interfaces.ts / PalProvider.tsx / index.ts
│       ├── screens/        ← 共享页面（RN 原生，Metro 端用）
│       ├── components/     ← 共享 UI 组件
│       ├── data/           ← tiles.tsx 等数据（⚠️ 顶层 require 图片）
│       ├── services/       ← httpClient 等
│       ├── utils/          ← scaling 等
│       └── assets/         ← 图片/动画
└── apps/
    ├── vega/       (@amazon-devices/keplerproject) ← Metro 家族，用 shared/HomeScreen
    ├── google-tv/  (@workspace/google-tv)          ← Metro 家族，用 shared/HomeScreen
    └── tizen/      (@workspace/tizen)              ← Web 家族，目前 fork 了 WebHomeScreen
```

### 两个 runtime 家族

| 家族 | 成员 | Bundler | 资源加载 | 平台分支机制 |
|------|------|---------|----------|--------------|
| **RN 原生** | vega / google-tv | Metro | `require('x.png')` | `.kepler.tsx` / `.android.tsx` 后缀 |
| **Web** | tizen（未来 TiVo OS） | Vite | ESM `import x.png` | `.web.tsx` 后缀 + **PAL 注入** |

> **关键**：Web 家族内部（Tizen vs 未来 TiVo OS）`Platform.OS` 都是 `'web'`，**无法用 `.web` 后缀或 `Platform.select` 区分**。它们之间的差异必须靠 **PAL 注入**（不同的 services 实现），而不是文件后缀。

### 当前共享现状（诚实记录）

- **vega ↔ google-tv**：真共享，`App.tsx` 几乎一致，直接用 `shared/HomeScreen`，只换 PAL。
- **tizen**：只共享 **PAL 接口 + 图片资源**；UI 在 `apps/tizen/src/WebHomeScreen.tsx` 独立维护（250 行，重写了 HomeScreen/Tile/Header，且 ApiDemo/动画尚未移植）。
- 这是**当前实现**的限制，非框架能力上限。把 shared UI 改成 web 安全（ESM 资源 + `.web.tsx` 分支 + 拆 barrel）后，Tizen 可复用真正的 HomeScreen，详见架构文档"三端一套 UI"路线。

---

## 2. PAL（平台抽象层）

shared 只依赖 `packages/shared/src/pal/interfaces.ts` 里的接口，运行时由各 app 注入实现。

```typescript
// app 入口注入
import {PalProvider} from '@workspace/shared/src/pal';
import {tizenPalServices} from './pal';
<PalProvider services={tizenPalServices}><HomeScreen /></PalProvider>

// shared 业务消费
const {system} = usePal();
const v = await system.getSystemVolume();
```

接口：`ISystemService` / `IMediaPlayer` / `IVoiceService`，聚合为 `PlatformServices`。新增方法时各端未实现会编译报错——这是有意的安全网。

每个 app 的 `src/pal/index.ts` 提供该平台实现（Tizen 用 `window.tizen` / `webapis`，Android 用 NativeModules，Vega 用 Kepler API）。

---

## 3. ⚠️ 踩过的坑（务必先读）

### 坑 #1：从 shared barrel import 触发 `require is not defined`（Web 端白屏）

**现象**：Tizen 在 Chrome/模拟器上**无报错白屏**，React 已挂载但 `#root` 0 子节点。

**根因**：`packages/shared/index.ts` 这个 barrel 同时 re-export 了 RN 原生屏 `HomeScreen`，其依赖 `src/data/tiles.tsx` 在**模块顶层**调用 Metro 写法的 `require('../assets/*.png')`。只要从 `@workspace/shared` import **任何东西**（哪怕只是 `usePal`），整个 barrel 被求值，浏览器 ESM 下 `require` 不存在 → 抛错 → PAL 为空 → 渲染空白。诡异之处是**控制台无错误**，光看 console 排查不出来。

**修复（当前做法）**：Web 端从 PAL **子路径**直接 import，绕开 barrel：
```typescript
// ✅ Tizen
import {PalProvider} from '@workspace/shared/src/pal';
import {usePal} from '@workspace/shared/src/pal';
// ❌ 不要在 web 端这样（会拖入原生屏）：
import {PalProvider, usePal} from '@workspace/shared';
```

**根治方向**：拆 barrel —— `shared/pal`（纯逻辑，跨端安全）与 `shared/ui`（RN 组件）分离，并用 `package.json` 的 `exports` 显式声明子路径。

### 坑 #2：ES module 脚本在 `file://` 下不加载（Tizen 装上后黑屏）

**根因**：Tizen `.wgt` 经 `file://`/opaque origin 加载，而 Vite 默认注入的 `<script type="module" crossorigin>` 始终按 CORS 加载，`file://`（origin=null）下被拒 → 脚本不执行 → 黑屏。dev server（http://）正常，所以只在真机/模拟器暴露。

**修复**：`apps/tizen/vite.config.ts` 里 `tizenClassicScript` 插件在构建时把模块脚本改写成经典 `<script defer>`。bundle 自包含（无顶层 import/export），改 classic 脚本安全。

### 坑 #3：React 双实例崩溃（`useState of null`）

nohoist 不完整会让 shared 和 app 用到不同 React 实例。根 `package.json` 全局 nohoist `**/react`、`**/react-native` 解决。

### 坑 #4：Android TV 焦点切换闪烁

react-native-tvos 的 blur/focus 异步分帧派发，`onBlur` 同步重置状态导致中间多渲染一帧。修复：`onBlur` 改 no-op，状态只由 `onFocus` 驱动。Vega（Kepler）同步批处理，无此问题。

### 坑 #5：未签名 `.wgt` 静默生成

`tizen package` 在 profile 缺失时**仍退出码 0**，只警告并产出未签名包（装不上）。打包脚本已加解压校验 `author-signature.xml`，未签名即报错。见 [deployment.md](deployment.md) §3.3。

---

## 4. 本地开发

```bash
# Tizen（Web，浏览器实时预览，最快迭代）
yarn tizen:dev          # vite dev server，端口 3000

# Metro 家族
yarn vega:start
yarn android:start
yarn stop               # 清理占用 8081 的 Metro 进程
```

Tizen 用浏览器开发最快，但**真机行为与 Chrome 有差异**（file:// 脚本加载、Tizen Web API、遥控键码），关键改动仍需在模拟器/真机回归。

---

## 5. 新增一个平台的成本

1. `apps/<platform>/` 薄壳：入口 + `src/pal/index.ts`（实现三个接口）+ 打包配置；
2. shared 层零改动（若 UI 已 web 安全）；
3. 归入对应 runtime 家族：Android 系（如 TiVo Stream 4K）→ 复用 RN 家族；Web 系（如 TiVo OS）→ 复用 Web 家族。

增量 ≈ 一份 PAL 实现 + 一份打包配置。
