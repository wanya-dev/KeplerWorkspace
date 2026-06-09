# 部署指南（Build & Deploy）

三端的构建/部署方式不同，通常从 monorepo 根目录用
`yarn <platform>:*` 脚本驱动。

> 当前部分 clean/deploy 脚本包含 `rm`、`grep`、`awk` 等 Unix 命令。
> Windows PowerShell 环境建议使用 Git Bash/WSL，或直接运行对应的
> Gradle、Vite、Tizen CLI 命令。

| 平台 | Runtime | Bundler | 产物 | 部署目标 |
|------|---------|---------|------|----------|
| Vega OS | react-native-kepler 0.72 | Metro | `.vpkg` | Vega 虚拟设备 / Fire TV |
| Google TV | react-native-tvos 0.72.6-1 | Metro | `.apk` | Android TV 设备 / 模拟器 |
| Tizen TV | react-native-web 0.19 | Vite | `.wgt`（签名） | Tizen TV 模拟器 / 真机 |

---

## 1. Vega OS

```bash
yarn vega:build          # react-native build-vega --build-type Release → .vpkg
yarn sim:start           # 启动 Vega 虚拟设备
yarn vega:vvd:intel      # 部署到 x86_64 虚拟设备
# 其它目标：
yarn vega:vvd:mseries    # aarch64 虚拟设备
yarn vega:firetv         # armv7 真机（Fire TV）
yarn vega:run            # = build + 部署到 intel 虚拟设备（一步）
```

调试构建：`yarn vega:build:debug`。Metro：`yarn vega:start`。

---

## 2. Google TV (Android TV)

前置：Android SDK + 一台已开启 ADB 调试的 Android TV / 模拟器。

```bash
yarn android:deploy        # gradlew installRelease → adb 启动 MainActivity
yarn android:deploy:clean  # 清理 android/app/build 后全量构建部署
yarn android:start         # Metro
```

包名 / 启动 Activity：`com.keplerandroidtv/.MainActivity`。

---

## 3. Tizen TV（重点：签名打包）

> ⚠️ **Apple Silicon Mac 跑不了 TV 模拟器**：TV 模拟器是 x86_64 + Intel HAXM 硬件虚拟化，HAXM 不支持 Apple Silicon。M 系列 Mac 只能用来**签名打包**，模拟器验证需在 **Windows / Linux (x86)** 机器上做。

### 3.1 分工建议

| 机器 | 职责 | 需要证书/profile |
|------|------|------------------|
| Mac (M 系列) | `yarn tizen:package` 签名出 `.wgt` | ✅ |
| Windows (x86) | 启动模拟器 + `tizen install` | ❌（只装签名包） |

签名 `.wgt` 是自包含、可移植的：Mac 签好拷到 Windows 直接装。证书只放一处。

### 3.2 一次性：创建签名 profile

Tizen 设备/模拟器拒绝**未签名**包（校验 `author-signature.xml`），所以必须用 author 证书签名。

```bash
# Mac（无需改 PATH，用绝对路径即可）
~/tizen-studio/tools/ide/bin/tizen security-profiles add -n skyworth \
  -a /path/to/TizenTv_auth.p12 -p '<p12 密码>'

~/tizen-studio/tools/ide/bin/tizen security-profiles list   # 确认 skyworth (Active=O)
```

- profile 名（这里 `skyworth`）随意，对应打包脚本默认值，可用 `TIZEN_PROFILE` 覆盖。
- distributor 证书会自动用 Tizen Studio 自带的默认证书，无需额外配置。
- **profile 是每台机器各自的**（存在各自的 `tizen-studio-data/profile/profiles.xml`）。要在 Windows 自己签名，需在 Windows 上重新建一次 profile 并拷入 `.p12`。

### 3.3 构建 + 签名打包

```bash
yarn tizen:package       # vite build + scripts/package-wgt.js（自动签名）
# 自定义 profile：
TIZEN_PROFILE=myprofile yarn tizen:package
```

脚本（`apps/tizen/scripts/package-wgt.js`）做了：
1. 自动定位 `tizen` CLI（无需配 PATH）；
2. 把 `config.xml` 拷进 `dist/`，缺 `icon.png` 时用占位图；
3. 用 profile 签名打包；
4. **解压校验 `author-signature.xml` 确实存在**——未签名直接报错退出，避免给出"假装成功"的未签名包。

产物位于 `apps/tizen/dist/`。具体 `.wgt` 文件名由 Tizen CLI 和
`config.xml` 决定，命令行使用时建议始终加引号。

### 3.4 Tizen Studio Run Project

Tizen Studio 不会编译 shared TypeScript/TSX。每次修改 shared UI、焦点、
Tizen PAL 或 Web 组件后，先执行：

```bash
yarn tizen:build
```

再在 Tizen Studio 中执行 `Run Project` / `Run As → Tizen Web Application`。

运行链路：

```text
apps/tizen/index.html
  → packaged runtime 自动跳转
apps/tizen/dist/index.html
  → ./assets/index.js 和图片资源
```

root `index.html` 只用于 Vite dev 与 Tizen Studio 包装，不是正式应用页面。
不要直接让它加载 `dist/assets/index.js`，否则图片相对路径会指向错误目录。

如果 Run 后仍是旧 UI：

1. 确认 `dist/assets/index.js` 的时间已经更新；
2. 从模拟器卸载旧应用；
3. 重新执行 Run Project。

### 3.5 在 Windows 模拟器上安装

把签名 `.wgt` 拷到 Windows，`C:\tizen-studio\tools` 与
`tools\ide\bin` 加入 PATH：

```bat
sdb devices                                  :: 启动 TV 模拟器后查看 serial
tizen install -n "<package-name>.wgt" -t <serial>
```

### 3.6 其它打包方式（不改环境变量）

- **绝对路径**：`C:\tizen-studio\tools\ide\bin\tizen.bat package -t wgt -s skyworth -- dist`
- **Tizen Studio GUI**：Certificate Manager 选证书 → 项目右键 `Build Signed Package`，或 `Run As → Tizen Web Application`（自动签名+装+启动）。

### 3.7 安装到真机

Mac/Windows 都可（`sdb` 是纯网络客户端）：电视端开「开发者模式」并填入 Host PC IP，然后：

```bash
sdb connect <电视IP>:26101
sdb devices
tizen install -n "<package-name>.wgt" -t <serial>
```

> 上真实商用 Samsung TV 需对应的 distributor 权限证书（partner/public），与本地模拟器用的默认 distributor 不同。

### 3.8 Tizen 发布前检查

- 执行 `yarn typecheck:tizen`。
- 执行 `yarn tizen:build`。
- 在模拟器验证四方向、确认键、返回键和初始焦点。
- 检查所有图片均从 `dist/assets/` 正确加载。
- 验证 HTTPS、CORS、证书和真实 API。
- 使用签名后的 `.wgt` 安装测试。
- 至少在一台目标年份的 Samsung 真机上回归。
