# 零基础学习指南：React Native、Web 与 TV 开发

本文面向没有前端、React Native 或 Web 开发经验的学习者。
目标不是一次学完所有概念，而是能逐步读懂、修改、运行当前项目。

## 1. 学习目标

完成本指南后，你应该能够：

- 看懂基本 JavaScript / TypeScript。
- 理解 React 组件、props、state 和 Hook。
- 理解 React Native 与 Web DOM 的区别。
- 修改 shared UI，并在 Google TV、Vega、Tizen 中验证。
- 理解 PAL 为什么存在。
- 为简单 TV 页面添加卡片和焦点。
- 知道生产项目还需要补哪些能力。

## 2. 先建立整体认识

这个项目使用一套 React 组件描述 UI，但运行环境不同：

```text
共享 React 代码
    |
    +-- Google TV -> React Native -> Android 原生视图
    +-- Vega      -> React Native -> Vega 原生视图
    +-- Tizen     -> react-native-web -> HTML DOM
```

React 负责组件和状态，React Native 提供 `View`、`Text`、`Image` 等抽象。
在 Tizen 中，`react-native-web` 会把这些组件转换为 HTML。

## 3. 第一阶段：JavaScript 基础

建议先掌握：

- `const`、`let`
- 字符串、数字、布尔值、数组、对象
- 函数和箭头函数
- `if`、`switch`
- `map`、`find`、`filter`
- `import` / `export`
- `Promise`、`async` / `await`
- 解构和展开运算符

当前项目中的例子：

```ts
const focusedTile = tiles.find(tile => tile.id === focusedTileId);

const labels = tiles.map(tile => tile.label);

const handlePress = async () => {
  const volume = await system.getSystemVolume();
};
```

### 练习

打开：

```text
packages/shared/src/data/tiles.tsx
```

修改某个卡片的 `label` 和 `description`，然后重新运行平台。

## 4. 第二阶段：TypeScript 基础

TypeScript 在 JavaScript 上增加类型检查。

```ts
interface TileData {
  id: string;
  label: string;
  description: string;
}
```

类型的作用：

- IDE 能提示属性。
- 拼错字段时提前报错。
- 修改接口后提醒所有平台补实现。

常见语法：

```ts
const title: string = 'Home';
const items: TileData[] = [];
const selected: TileData | undefined = items.find(item => item.id === 'home');
```

### 验证

```bash
yarn typecheck
```

如果本机没有全局 Yarn，也可以在具体 app 中运行本地 `tsc.cmd`。

## 5. 第三阶段：React 基础

### 5.1 组件

组件是返回 UI 的函数：

```tsx
const Greeting = () => {
  return <Text>Hello TV</Text>;
};
```

### 5.2 Props

Props 是父组件传入的数据：

```tsx
interface GreetingProps {
  name: string;
}

const Greeting = ({name}: GreetingProps) => {
  return <Text>Hello {name}</Text>;
};
```

使用：

```tsx
<Greeting name="Tizen" />
```

### 5.3 State

State 是组件内部会变化的数据：

```tsx
const [selectedId, setSelectedId] = useState('home');
```

更新 state 会触发重新渲染。

### 5.4 Hook

当前项目常用：

- `useState`：保存状态。
- `useEffect`：组件出现或依赖变化后执行副作用。
- `useCallback`：稳定事件函数。
- `useRef`：保存 DOM、原生节点或不触发渲染的数据。
- `useContext`：读取 PAL 和焦点上下文。

### 重要规则

- Hook 只能在组件顶层调用。
- 不要在 `if`、循环或普通函数中调用 Hook。
- 不要保存两份含义相同的 state。

焦点相关尤其要遵守：`focusedId` 只能有一个状态来源。

## 6. 第四阶段：React Native 基础

React Native 不直接使用 HTML：

| Web | React Native |
|---|---|
| `<div>` | `<View>` |
| `<p>` / `<span>` | `<Text>` |
| `<img>` | `<Image>` |
| CSS 文件 | `StyleSheet.create()` |
| `onclick` | `onPress` |

示例：

```tsx
<View style={styles.card}>
  <Text style={styles.title}>Home</Text>
</View>
```

```ts
const styles = StyleSheet.create({
  card: {
    width: 320,
    height: 180,
    backgroundColor: '#1479B8',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 40,
  },
});
```

### Flexbox

TV 页面主要使用 Flexbox：

- `flexDirection: 'row'`：横向排列。
- `flexDirection: 'column'`：纵向排列。
- `alignItems`：交叉轴对齐。
- `justifyContent`：主轴对齐。
- `flex: 1`：占据剩余空间。

### 练习

打开：

```text
packages/shared/src/components/Tile.tsx
```

尝试：

1. 修改默认背景色。
2. 修改 focused 背景色。
3. 把焦点缩放从 `1.1` 改为 `1.05`。
4. 重新运行三个平台观察区别。

## 7. 第五阶段：Web 与 Tizen

### 7.1 浏览器中的 React Native

Tizen 使用：

```text
React
  -> react-native-web
  -> HTML DOM
  -> Tizen WebKit
```

Vite 负责把 TS/TSX、React 和图片打包到 `dist/`。

### 7.2 开发服务器

```bash
yarn tizen:dev
```

浏览器开发迭代快，但不能完全代表电视：

- 浏览器键盘事件可能不同。
- Tizen 有自己的 Web API。
- 模拟器/真机使用 widget/file runtime。
- 不同年份电视的 WebKit 能力不同。

### 7.3 Tizen Studio

修改代码后先构建：

```bash
yarn tizen:build
```

再执行 `Run Project`。

Tizen Studio 不会自动编译 shared TSX。实际页面位于：

```text
apps/tizen/dist/index.html
```

### 7.4 Web 平台文件

例如：

```text
HeaderLogo.tsx       Native 默认实现
HeaderLogo.web.tsx   Tizen/Web 实现
```

如果 Web 和 Native 行为不同，优先使用平台文件，而不是在一个组件里写大量
`if (Platform.OS === ...)`。

## 8. 第六阶段：Google TV

Google TV app 位于：

```text
apps/google-tv/
```

主要组成：

- React Native JS/TS。
- `react-native-tvos`。
- Android Java 原生工程。
- Metro bundler。
- Gradle 构建。

入口：

```text
apps/google-tv/src/App.tsx
```

原生能力示例：

```text
apps/google-tv/android/app/src/main/java/
```

`SystemServiceModule.java` 把 Android 系统能力暴露给 JS PAL。

常用命令：

```bash
yarn android:start
yarn android:deploy
```

Windows 下现有 deploy 脚本包含 Unix 命令，建议使用 Git Bash/WSL，或进入
`apps/google-tv/android` 后直接运行 Gradle 和 ADB。

## 9. 第七阶段：Vega

Vega app 位于：

```text
apps/vega/
```

它也使用 React Native 和 Metro，但底层不是 Android。

入口：

```text
apps/vega/src/App.tsx
```

平台实现：

```text
apps/vega/src/pal/index.ts
```

常用命令：

```bash
yarn vega:start
yarn vega:build:debug
yarn vega:run
```

需要特别注意：

- Android NativeModules 不能直接复制到 Vega。
- Android 的焦点 API 不一定能在 Vega 使用。
- Vega 平台差异放在 `.kepler.tsx` 或 Vega PAL。
- 当前 Vega 播放器、语音和部分系统能力仍是示例实现。

## 10. 第八阶段：PAL

PAL 是 Platform Abstraction Layer，平台抽象层。

业务组件只调用接口：

```ts
const {system} = usePal();
const volume = await system.getSystemVolume();
```

不同平台提供不同实现：

```text
Google TV -> Android NativeModules
Vega      -> Kepler API
Tizen     -> Tizen Web API / webapis
```

增加平台能力的步骤：

1. 在 `packages/shared/src/pal/interfaces.ts` 增加接口。
2. 在 Google TV PAL 实现。
3. 在 Vega PAL 实现。
4. 在 Tizen PAL 实现。
5. 运行 `yarn typecheck`。

不要在 shared 组件中直接调用 `window.tizen` 或 Android NativeModules。

## 11. 第九阶段：TV 焦点

电视没有触摸屏，主要输入是：

- 上
- 下
- 左
- 右
- 确认
- 返回

当前示例：

```tsx
<Tile
  id="api-demo"
  focusRow={0}
  focusCol={1}
  focusZone="home-tiles"
/>
```

必须理解：

- DOM focus、Native focus 和视觉高亮不是天然同一件事。
- 项目使用 `focusedId` 作为 shared UI 的唯一状态。
- 不要在页面中再保存第二个 focused tile state。
- `onBlur` 不要把焦点清空。

复杂项目请阅读 [焦点管理](focus-management.md)。

## 12. 推荐练习顺序

### 练习 1：修改文字

文件：

```text
packages/shared/src/components/Header/Header.tsx
```

目标：修改标题和副标题，在三个平台验证。

### 练习 2：修改卡片样式

文件：

```text
packages/shared/src/components/Tile.tsx
```

目标：修改颜色、尺寸、焦点缩放。

### 练习 3：增加一个卡片

文件：

```text
packages/shared/src/data/tiles.tsx
packages/shared/src/screens/HomeScreen.tsx
```

目标：

- 增加 `settings` tile。
- 配置图标和描述。
- 焦点可以移动到新卡片。

### 练习 4：增加 PAL 方法

例如：

```ts
getPlatformName(): string;
```

目标：

- 三个平台分别返回平台名称。
- Header 通过 PAL 显示名称。
- 不再通过 `Platform.OS` 区分 Tizen 与未来 TiVo。

### 练习 5：增加新页面

目标：

- 新建 `SettingsScreen`。
- 用简单 state 切换页面。
- 返回 Home 时恢复原来的焦点。

### 练习 6：处理错误状态

目标：

- 为 API Demo 添加 loading、error、retry。
- 在模拟器无网络时仍保持页面可操作。

## 13. 调试方法

遇到问题按这个顺序检查：

1. TypeScript 是否通过：

```bash
yarn typecheck
```

2. 构建是否成功。
3. 模拟器是否运行最新产物。
4. 页面是否进入 `dist/index.html`。
5. 图片路径是否正确。
6. 焦点视觉状态与真实焦点是否一致。
7. 平台 API 是否存在。

不要同时修改构建、焦点和业务逻辑后再一起调试。每次只验证一个变化。

## 14. 学习完成后的下一步

继续学习：

- React Navigation 或自有路由。
- Zustand/Redux 等状态管理。
- 虚拟列表和大数据量海报墙。
- 视频播放器、DRM、字幕和广告。
- 自动化测试。
- 性能分析和内存管理。
- Tizen/Google TV/Vega 发布流程。

生产项目不要直接把示例 stub 当作正式实现。开始真实业务前，先阅读
[跨平台架构](architecture/multi_tv_architecture.md) 中的生产项目补齐清单。
