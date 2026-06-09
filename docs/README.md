# KeplerWorkspace 文档

跨平台 TV 应用示例，当前覆盖 **Google TV**、**Vega OS** 和
**Tizen TV**，架构可继续扩展 TiVo OS/WebOS 等 Web TV 平台。

## 文档导航

| 文档 | 内容 |
|------|------|
| [learning-guide.md](learning-guide.md) | 面向前端、React、RN 零基础的分阶段学习路线与仓库练习 |
| [architecture/multi_tv_architecture.md](architecture/multi_tv_architecture.md) | 整体架构、runtime 家族划分、PAL 设计、代码复用率、迁移路线 |
| [focus-management.md](focus-management.md) | TV 遥控器焦点管理模型、FocusProvider / useFocusable 使用方式 |
| [development.md](development.md) | 代码结构、共享边界、PAL 用法、**踩坑清单**、本地开发 |
| [deployment.md](deployment.md) | 三端构建/部署，Tizen **签名打包**完整流程 |

## 快速开始

```bash
yarn install

# 本地开发
yarn tizen:dev        # Tizen（浏览器实时预览，迭代最快）
yarn vega:start       # Vega Metro
yarn android:start    # Google TV Metro

# 质量检查
yarn typecheck

# 构建部署
yarn vega:run                 # Vega 构建 + 部署到虚拟设备
yarn android:deploy           # Google TV 构建 + ADB 部署
yarn tizen:build              # Tizen Studio Run Project 前必须执行
yarn tizen:package            # Tizen 签名打包出 .wgt
```

## 平台一览

| 平台 | 包名 | Runtime | 家族 |
|------|------|---------|------|
| Vega OS | `@amazon-devices/keplerproject` | react-native-kepler 0.72 | RN 原生 |
| Google TV | `@workspace/google-tv` | react-native-tvos 0.72.6-1 | RN 原生 |
| Tizen TV | `@workspace/tizen` | react-native-web 0.19 + Vite | Web |
| 共享层 | `@workspace/shared` | — | — |

## 新人必读

零基础建议先看 [学习指南](learning-guide.md)，再看
[开发指南](development.md)。开发时尤其注意 Tizen 的
`Vite build → dist/index.html → Run Project` 链路，以及
[焦点管理](focus-management.md) 中的单一焦点状态规则。

当前示例可用于学习和架构验证；播放器、DRM、复杂焦点、虚拟列表和发布流水线
仍需要在生产项目中补齐。
