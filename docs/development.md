# 开发指南

本文说明当前代码结构、共享边界、Tizen 开发流程和已知限制。
整体设计见 [跨平台架构](architecture/multi_tv_architecture.md)，焦点见
[焦点管理](focus-management.md)，发布见 [部署指南](deployment.md)。

## 1. 当前结构

```text
KeplerWorkspace/
├── packages/shared/
│   ├── index.ts
│   └── src/
│       ├── core.ts          # 共享 UI、HTTP、焦点等公共导出
│       ├── native.ts        # RN runtime 入口
│       ├── web.ts           # Web runtime 入口
│       ├── pal/             # 平台能力接口和 PalProvider
│       ├── focus/           # 示例级跨平台焦点管理
│       ├── screens/         # 共享页面
│       ├── components/      # 共享组件及 .web/.android/.kepler 分支
│       ├── assets/          # 图片及平台资源入口
│       ├── services/        # HTTP 等通用服务
│       └── utils/           # 缩放工具
└── apps/
    ├── google-tv/           # react-native-tvos + Android 原生工程
    ├── vega/                # react-native-kepler
    └── tizen/               # React DOM + react-native-web + Vite
```

当前三个 app 都复用 `packages/shared/src/screens/HomeScreen.tsx`，各 app
只负责入口、PAL 实现、原生工程和构建配置。

## 2. Runtime 家族

| 家族 | 平台 | 渲染 | Bundler | 平台文件 |
|---|---|---|---|---|
| RN Native | Google TV、Vega | 原生视图 | Metro | `.native`、`.android`、`.kepler` |
| Web TV | Tizen，未来 TiVo OS/WebOS | DOM | Vite | `.web` |

Tizen 与未来 TiVo OS 的 `Platform.OS` 都是 `web`。品牌级差异不能写死在
shared UI 中，应通过 PAL、应用配置或品牌主题注入。

## 3. Shared 入口

RN app 当前可以从默认入口导入：

```tsx
import {HomeScreen, PalProvider} from '@workspace/shared';
```

Tizen 使用明确的 Web 入口：

```tsx
import {HomeScreen, PalProvider} from '@workspace/shared/src/web';
```

资源文件也按 runtime 分开：

- `images.native.ts` 使用 Metro `require()`。
- `images.web.ts` 使用 Vite ESM 图片 import。
- 平台组件使用 `.web.tsx`、`.android.tsx`、`.kepler.tsx`。

不要在 Web 专用模块中直接执行 Metro `require()`。

## 4. PAL

shared 只依赖接口，各 app 注入平台实现：

```tsx
<PalProvider services={tizenPalServices}>
  <HomeScreen />
</PalProvider>
```

当前接口包括：

- `ISystemService`
- `IMediaPlayer`
- `IVoiceService`
- `PlatformServices`

Google TV 通过 NativeModules 调用 Java；Tizen 使用 `window.tizen` /
`window.webapis`；Vega 使用 Kepler 能力或当前示例降级实现。

播放器和语音实现目前仍以示例/stub 为主，生产项目前必须替换。

## 5. 焦点

当前示例使用 `FocusProvider` 和 `useFocusable`：

- `focusedId` 是唯一焦点状态源。
- `row`、`col` 描述规则网格位置。
- `zone` 描述焦点区域。
- Tizen 同时兼容 `event.key` 和方向键 `keyCode 37-40`。
- `onBlur` 不重置状态。

页面不得再用单独的 `useState` 保存第二份 focused tile。

当前实现适合示例和规则网格。复杂生产项目建议：

- Google TV/Vega：原生 TV focus、`TVFocusGuideView`、`nextFocus*`。
- Tizen/TiVo Web：Norigin Spatial Navigation 等 Web 空间导航方案。
- shared 只统一 `FocusKey`、zone、记忆和恢复协议。

详见 [焦点管理](focus-management.md)。

## 6. Tizen 开发流程

浏览器迭代：

```bash
yarn tizen:dev
```

Tizen Studio / 模拟器运行：

```bash
yarn tizen:build
```

然后执行 Tizen Studio 的 `Run Project`。

原因：Tizen Studio 不会编译 shared TSX。根 `apps/tizen/index.html` 只是
开发/Studio 包装入口，在 packaged runtime 中会跳转到
`dist/index.html`，真正执行的是 Vite 构建产物。

每次修改 shared、Tizen PAL 或 Web 组件后，都要重新 `tizen:build`。
若模拟器仍显示旧内容，卸载旧应用后重新 Run。

## 7. Tizen 资源路径

正式页面必须从 `dist/index.html` 运行。这样 bundle 中的：

```text
./assets/background.png
./assets/get-started.png
./assets/debug.png
./assets/learn-more.png
```

才能相对 `dist/` 正确解析。

不要在 root `index.html` 中直接注入 `dist/assets/index.js`，否则独立图片会
错误地解析到 root `assets/`。小图片可能被 Vite 内联为 data URL，看似正常，
容易掩盖这个问题。

## 8. Tizen 构建兼容

`apps/tizen/vite.config.ts` 当前处理：

- `base: './'`，生成相对资源路径。
- 将 module script 改为经典 `<script defer>`，兼容 widget/file runtime。
- 替换 classic script 中不能使用的 `import.meta.url` 资源表达式。
- 移除只供 Tizen Studio 使用的 fallback 代码。

Web 组件应避免依赖新浏览器全局或旧 Tizen WebKit 不稳定的行为。
动画示例使用 CSS animation，避免旧 WebKit 上 RN Animated 卸载异常。

## 9. 类型检查

```bash
yarn typecheck
yarn typecheck:vega
yarn typecheck:android
yarn typecheck:tizen
```

各 app 的 `tsconfig` 显式映射自己的 React/RN 类型，并使用
`moduleSuffixes` 匹配对应平台文件。

## 10. 常见问题

### 页面只有背景色

- 没有执行 `yarn tizen:build`。
- Studio 正在运行旧应用。
- classic script 解析失败。
- root 页面没有跳转到 `dist/index.html`。

### 文字更新未生效

shared 源码已改，但 `dist/assets/index.js` 仍是旧 bundle。重新 build。

### 部分图标不显示

页面基准路径错误。确保最终运行的是 `dist/index.html`。

### 两个卡片同时高亮

页面和 FocusProvider 同时保存了焦点状态。只使用
`useFocusManager().focusedId`。

### API Demo 显示 Failed to fetch

通常是模拟器网络、证书或 CORS 限制，不代表焦点系统故障。生产项目应使用
自己的 HTTPS API、允许来源配置及平台网络策略。
