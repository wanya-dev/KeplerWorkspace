# TV Focus Management

当前示例把焦点视为基础设施，而不是分散在页面组件中的局部状态。
`FocusProvider` 适合学习、原型和简单页面；复杂生产项目应按 Native TV
与 Web TV runtime 分别选择底层焦点引擎。

## 当前实现

- `FocusProvider` 保存唯一的 `focusedId` 和可聚焦元素注册表。
- `useFocusable(id, options)` 注册元素及其 `row`、`col`、`zone`。
- `zone` 用于区分导航栏、内容列表、播放器控制条和弹窗等焦点区域。
- Web/Tizen 在捕获阶段监听方向键，同时支持：
  - `event.key`: `ArrowLeft`、`ArrowRight`、`ArrowUp`、`ArrowDown`
  - `event.keyCode`: `37`、`39`、`38`、`40`
- Native TV 的 `onFocus` 会把平台真实焦点同步回 `FocusProvider`。
- 调用 DOM `focus()` 前会检查 `document.activeElement`，避免
  `setFocus -> focus() -> onFocus -> setFocus` 的重复调用。

## 使用示例

```tsx
<FocusProvider initialFocusId="home">
  <Tile
    id="home"
    focusRow={0}
    focusCol={0}
    focusZone="home-tiles"
  />
  <Tile
    id="api-demo"
    focusRow={0}
    focusCol={1}
    focusZone="home-tiles"
  />
</FocusProvider>
```

页面内容和卡片样式都必须读取同一个 `focusedId`：

```tsx
const {focusedId} = useFocusManager();
const focusedTileId = focusedId ?? 'home';
```

不要再用页面 `useState` 保存第二份焦点状态，否则可能出现两个卡片同时
高亮、标题与实际焦点不一致等问题。

## 实现规则

- 每个可操作控件必须可聚焦。
- `focusedId` 是共享 UI 的唯一焦点状态源。
- 不要在 `onBlur` 中重置焦点，让下一个 `onFocus` 完成状态切换。
- 初始化焦点只执行一次，不要在每次渲染时反复设置 preferred focus。
- 方向键监听应阻止浏览器默认行为，避免 WebKit 自带导航与焦点引擎竞争。
- 弹窗和播放器控制条应使用独立 zone，并实现焦点陷阱。
- 页面返回、弹窗关闭后应恢复之前的 `FocusKey`。
- 动画组件卸载不能影响焦点树或抛出未处理异常。
- 焦点视觉必须明显，并在电视安全区内避免放大后被裁切。

## 当前限制

当前 `row` / `col` 算法适用于规则网格，不完整支持：

- 不规则尺寸卡片和瀑布流。
- 虚拟化长列表。
- 多级侧边栏与跨区域优先级。
- 弹窗焦点陷阱。
- 路由级焦点记忆和恢复。
- 滚动容器与焦点联动。
- 元素动态增删后的空间重新计算。

因此不要直接把当前示例焦点管理器扩展成所有平台共用的大型引擎。

## 生产项目建议

共享层只统一焦点语义：

```ts
interface FocusService {
  focus(key: string): void;
  remember(screen: string, key: string): void;
  restore(screen: string): void;
  trap(zone: string): void;
  release(zone: string): void;
}
```

底层实现按 runtime 分开：

- Google TV / Vega / Apple TV：原生 TV focus、`react-native-tvos`、
  `TVFocusGuideView` 和 `nextFocus*`。
- Tizen / TiVo OS / WebOS：Norigin Spatial Navigation 或同类 Web
  空间导航引擎。
- shared 业务层只使用稳定的 `FocusKey`、zone、记忆和恢复协议。

这样可以共享业务行为，同时保留各平台成熟、可预测的原生焦点能力。
