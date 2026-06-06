# KeplerWorkspace 文档

跨平台 TV 应用 Demo —— 一套代码覆盖 **Google TV**、**Vega OS**、**Tizen TV**（未来 TiVo OS）。

## 文档导航

| 文档 | 内容 |
|------|------|
| [architecture/multi_tv_architecture.md](architecture/multi_tv_architecture.md) | 整体架构、runtime 家族划分、PAL 设计、代码复用率、迁移路线 |
| [development.md](development.md) | 代码结构、共享边界、PAL 用法、**踩坑清单**、本地开发 |
| [deployment.md](deployment.md) | 三端构建/部署，Tizen **签名打包**完整流程 |

## 快速开始

```bash
yarn install

# 本地开发
yarn tizen:dev        # Tizen（浏览器实时预览，迭代最快）
yarn vega:start       # Vega Metro
yarn android:start    # Google TV Metro

# 构建部署
yarn vega:run                 # Vega 构建 + 部署到虚拟设备
yarn android:deploy           # Google TV 构建 + ADB 部署
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

先看 [开发指南 §3 踩坑清单](development.md#3-踩过的坑务必先读)——尤其 Web 端的 `require is not defined` 白屏和 `file://` 黑屏两个坑，排查时极易卡住。
