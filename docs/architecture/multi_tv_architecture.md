# Multi-TV Cross-Platform Architecture

> Google TV + Vega OS + Tizen TV 跨平台架构

配套文档：[开发指南](../development.md) ·
[焦点管理](../focus-management.md) · [部署指南](../deployment.md) ·
[零基础学习指南](../learning-guide.md)

## 1. 目标

在 Google TV、Vega OS 和 Tizen TV 上最大化共享业务与 UI，同时保留
各平台播放器、系统 API、焦点和发布能力。

核心原则不是追求 100% 相同实现，而是按 runtime 家族复用：

| Runtime 家族 | 平台 | 技术 |
|---|---|---|
| RN Native | Google TV、Vega | React Native 0.72、Metro |
| Web TV | Tizen，未来 TiVo OS/WebOS | React DOM、react-native-web、Vite |

## 2. 当前 Monorepo

```text
packages/shared/
├── index.ts
└── src/
    ├── core.ts
    ├── native.ts
    ├── web.ts
    ├── pal/
    ├── focus/
    ├── screens/
    ├── components/
    ├── assets/
    ├── services/
    └── utils/

apps/
├── google-tv/
├── vega/
└── tizen/
```

三个 app 当前共享 `HomeScreen`、Tile、Header、API Demo 和动画示例。
平台差异通过文件后缀、PAL 和 app 壳处理。

各 app 的职责：

| App | Runtime | 入口职责 | 平台实现 |
|---|---|---|---|
| `apps/google-tv` | `react-native-tvos` | 注入 Android PAL | Android NativeModules / Java |
| `apps/vega` | `react-native-kepler` | 注入 Vega PAL | Kepler API / RN 降级实现 |
| `apps/tizen` | React DOM + `react-native-web` | 注入 Tizen PAL并挂载 DOM | Tizen Web API / `webapis` |

## 3. 分层

```text
Shared UI / Screens
        |
Shared domain and services
        |
PAL interfaces + focus contracts
        |
  +-----+------------------+
  |                        |
RN Native implementations Web TV implementations
Google TV / Vega          Tizen / future TiVo OS
```

### Shared 层适合放

- 数据模型、状态、用例和 API client。
- 页面编排及跨平台安全组件。
- Design tokens 和缩放规则。
- PAL 接口。
- `FocusKey`、zone、焦点记忆协议。

### App 层适合放

- Native Module / Tizen Web API。
- 播放器、DRM、语音、系统集成。
- 遥控器键码适配。
- 打包、签名和商店配置。
- 无法合理共享的平台专用 UI。

## 4. Shared 入口

```text
@workspace/shared             默认/RN 兼容入口
@workspace/shared/src/native  RN runtime 明确入口
@workspace/shared/src/web     Web runtime 明确入口
@workspace/shared/src/pal     PAL 子入口
```

Web 资源使用 ESM import，Native 资源使用 Metro `require()`。通过
`.web/.native/.android/.kepler` 后缀选择实现。

## 5. PAL

当前 `PlatformServices` 聚合：

```ts
interface PlatformServices {
  system: ISystemService;
  player: IMediaPlayer;
  voice: IVoiceService;
}
```

PAL 的价值：

- shared 不直接依赖 `NativeModules`、`window.tizen` 或 `webapis`。
- 新增接口时，各平台实现受到 TypeScript 检查。
- 可注入 mock 进行业务测试。
- 后续更换原生桥接方式时，shared 调用方保持稳定。

当前播放器和语音仍是示例实现，不代表生产能力已经完成。

## 6. 焦点架构

当前 `FocusProvider` 是教学和简单网格方案：

- 单一 `focusedId`。
- `row/col/zone` 注册。
- Web 方向键与 Tizen keyCode 适配。
- Native `onFocus` 状态同步。

生产项目建议统一上层协议、分开底层引擎：

```ts
interface FocusService {
  focus(key: string): void;
  remember(screen: string, key: string): void;
  restore(screen: string): void;
  trap(zone: string): void;
  release(zone: string): void;
}
```

- RN Native：平台原生 focus、`TVFocusGuideView`、`nextFocus*`。
- Web TV：Norigin Spatial Navigation 或同类空间导航库。

不要让页面 state、DOM focus 和 Native focus 各自维护互相独立的焦点状态。

## 7. Vega OS

Vega 是 RN Native 家族成员，但不是 Android：

| 维度 | Vega OS | Google TV |
|---|---|---|
| RN Runtime | `react-native-kepler` 0.72 | `react-native-tvos` 0.72.6-1 |
| Bundler | Metro | Metro |
| 原生能力 | Kepler API / Vega Native Module | Android NativeModules |
| 平台文件 | `.kepler.tsx`、`.native.tsx` | `.android.tsx`、`.native.tsx` |
| 产物 | `.vpkg` | `.apk` |
| 部署 | Vega Virtual Device / Fire TV | ADB / Android TV |

### Vega 入口

```tsx
import {HomeScreen, PalProvider} from '@workspace/shared';
import {vegaPalServices} from './pal';

export const App = () => (
  <PalProvider services={vegaPalServices}>
    <HomeScreen />
  </PalProvider>
);
```

Vega 和 Google TV 共享页面与业务，但各自注入不同 PAL。shared 层不应直接
判断“当前是不是 Vega”，平台差异应放在：

- `apps/vega/src/pal/`
- `.kepler.tsx` 平台组件
- Vega app 配置和 manifest
- Vega 构建/部署脚本

### 当前 Vega PAL 状态

当前示例中的部分 Vega 能力仍为占位或降级实现：

- `getDeviceId()` 优先尝试 `KeplerDeviceInfo`。
- `getSystemVolume()` 当前返回示例值。
- `showToast()` 当前降级为 RN `Alert`。
- `notifyContentReady()` 尚未接入 Amazon Catalog API。
- 播放器和语音服务当前仍是 stub。

生产项目需要使用实际 Kepler/Vega SDK 替换这些实现，不能把示例返回值带入
正式业务。

### Vega 焦点

Vega 使用 RN 原生焦点事件。当前共享 `FocusProvider` 可以同步简单示例状态，
但复杂项目应优先使用 Vega/React Native 提供的原生焦点能力，并在 shared
层只保留 `FocusKey`、zone、记忆和恢复协议。

不要假设 Android TV 的 `TVFocusGuideView`、`nextFocus*` 或 Native Module
能直接在 Vega 使用；需要通过 PAL 或 `.kepler` 实现提供等价行为。

### Vega 构建链路

```text
shared TSX
   -> Metro / react-native-kepler
Vega application bundle
   -> react-native build-vega
.vpkg
   -> Vega Virtual Device / Fire TV
```

常用命令：

```bash
yarn vega:start
yarn vega:build
yarn vega:build:debug
yarn vega:vvd:intel
yarn vega:vvd:mseries
yarn vega:firetv
yarn vega:run
```

## 8. Tizen 运行链路

```text
shared TSX
   -> Vite build
apps/tizen/dist/index.html
   -> classic deferred bundle
dist/assets/index.js + images
   -> Tizen Web runtime
```

Tizen Studio 的 root `index.html` 是包装入口。在 packaged runtime 中，它会
跳转到 `dist/index.html`，保证脚本和图片拥有正确的相对路径基准。

## 9. 代码复用预期

合理目标：

- 领域逻辑/API/状态：80%-95%。
- 页面编排和基础 UI：60%-90%。
- 焦点底层、播放器、DRM、系统集成：按 runtime/platform 实现。
- 构建与发布：每个平台独立。

复用率不是越高越好。强行共享平台行为会把复杂度转移到大量条件判断中。

## 10. 新平台接入

### Android 系 TiVo

归入 RN Native 家族，复用 Google TV 技术栈，再增加品牌/系统 PAL。

### TiVo OS / Web 平台

归入 Web TV 家族，复用 shared Web UI、业务和焦点协议，新增：

- `apps/tivo/`
- TiVo PAL
- 遥控器键码适配
- 平台打包和发布配置

### Apple TV

使用 `react-native-tvos` 家族，增加 tvOS 工程和平台 PAL。

## 11. 生产项目还需补齐

- 真实播放器、DRM、字幕、音轨和广告。
- 路由与页面级焦点恢复。
- 虚拟化海报列表及滚动联动。
- 错误边界、离线缓存、日志和远程诊断。
- 设备能力探测和型号兼容矩阵。
- 自动化测试、真机冒烟和发布流水线。
- 平台配置、品牌和 feature flag 注入。
- Vega Kepler API、Amazon Catalog 和真实播放器集成。
