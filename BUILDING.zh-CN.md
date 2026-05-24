# 构建 Sarasa Adwaita

本文档包含 Sarasa Adwaita 的基本开发与构建说明。

> [!NOTE]
> 由于本项目由 AI 编写，建议让 AI 智能体操作编译流程。因为 AI 编写的文档可能**无法**涵盖所有细节，然而，作为人类，调试可能出现的问题会需要大量时间。

## 目录结构

```
Sarasa-Adwaita/
├─ package.json           # Node.js 项目配置
├─ config.jsonc           # 项目配置文件（上游仓库、路径、字体命名等）
├─ upstream/              # 上游 Git 仓库（不直接修改）
│  ├─ adwaita-fonts/      #   GNOME/adwaita-fonts
│  └─ Sarasa-Gothic/      #   be5invis/Sarasa-Gothic
├─ src/                   # 构建脚本源码（TypeScript）
├─ patches/               # 补丁文件
├─ target/                # 工作目录（构建产物、缓存、临时文件）
└─ pnpm-workspace.yaml
```

## 依赖

- Node.js >= 20 + pnpm
- Python3 + fonttools
- git / curl
- ttfautohint、AFDKO（otc2otf / otf2ttf）

## 快速开始

```bash
pnpm install
pnpm run build
```

## 工作流程

`pnpm run build` 会自动执行以下步骤：

### 1. 准备上游仓库

- 克隆/更新 `adwaita-fonts`（使用 `--depth 1`）
- 克隆/更新 `Sarasa-Gothic`（使用 `--depth 1`）
- 通过 `--shared` 复用机制创建工作副本

### 2. 获取 Iosevka 源码

- 下载与 Sarasa-Gothic 匹配版本的 Iosevka 源码 zip
- 解压到工作目录

### 3. 构建 Adwaita Mono（5 字重 × 直/斜体 = 10 个 TTF）

- 复制 Adwaita Mono 的 Iosevka build plan（`private-build-plans.toml`）
- 追加缺失字重（ExtraLight、Light、SemiBold）
- 运行 Iosevka 构建 `npm run build -- ttf::AdwaitaMono`
- 输出到 `目标目录/AdwaitaMono/TTF-Unhinted/`

### 4. 构建 Adwaita Sans（5 字重 × 直/斜体 = 10 个 TTF）

- 从 Adwaita Sans 变量字体（Variable Font）通过 `fonttools varLib.instancer` 切片
- 生成静态字重（opsz=14, wght=200/300/400/600/700）

### 5. 准备 Sarasa-Gothic 的 Latin 源码目录

- 将 Adwaita Sans TTF 复制到 `sources/AdwaitaSans/`
- 将 Adwaita Mono TTF 复制到 `sources/AdwaitaMonoN/` 和 `sources/AdwaitaMonoNFixed/`

### 6. 应用 Sarasa 配置补丁

- 备份 `config.json` 为 `config.json.orig`
- 备份 `verdafile.mjs` 为 `verdafile.mjs.orig`
- 添加 `latinGroups`（AdwaitaSans、AdwaitaMonoN、AdwaitaMonoNFixed）
- 修改 family 名称（"Sarasa Adwaita" / "更纱独黑" 等）
- 修改 `verdafile.mjs` 输出前缀为 `SarasaAdwaita`

### 7. 运行 Sarasa-Gothic 构建

- 在 Sarasa-Gothic 工作目录执行 `npm run build -- ttf`
- 生成 180 个未微调（Unhinted）TTF 文件——已跳过 Sarasa 自带的 hinting 流程
- Sarasa 构建完成后，我们的流程会使用 ttfautohint 对所有 TTF 进行微调，然后打包为 TTC

### 8. 收集构建产物

- 从 Sarasa 输出目录复制 TTF/TTC 到项目 `target/dist/`
- 生成构建报告

## 增量构建

项目支持增量构建：

- 如果 `target/cache/Iosevka-*.zip` 已存在，跳过下载
- 如果 Adwaita Mono TTF 已存在，跳过构建（可使用 `--skip-adwaita-mono` 强制跳过）
- 如果 Adwaita Sans TTF 已存在，跳过构建（可使用 `--skip-adwaita-sans` 强制跳过）
- 如果 TTF-Unhinted 文件已存在，跳过 Sarasa-Gothic 构建（可使用 `--skip-sarasa` 强制跳过）
- 相同的 Sarasa-Gothic 工作副本会被复用

可用选项：

```bash
pnpm run build -- --skip-adwaita-mono   # 跳过 Adwaita Mono 构建
pnpm run build -- --skip-adwaita-sans   # 跳过 Adwaita Sans 构建
pnpm run build -- --skip-sarasa         # 跳过 Sarasa-Gothic 重新构建（复用已有 TTF-Unhinted）
```

## 构建耗时与资源

构建 Sarasa Adwaita 需要大量计算资源：

- **TTF-Unhinted 阶段**（约 30 分钟，16 核机器；约 1.5 小时，2 核机器）：生成 180 个未微调 TTF 文件。主要耗时在 CJK 字形合成和编译。
- **ttfautohint 阶段**（约 3 分钟，16 核机器，并行）：使用 [ttfautohint](https://www.freetype.org/ttfautohint) 对所有 180 个 TTF 并行微调。每个字体耗时不超过 15 秒。相比原版 Sarasa 使用的 chlorophytum 引擎（平均每字重约 1.7 小时，180 个字体总计超过 100 小时，128 核机器），速度提升数千倍。
- **TTC 打包阶段**（约 10 分钟）：使用 `otb-ttc-bundle` 将微调后的 TTF 打包为 TTC。

提示：如果不需要 hinting，可以在 TTF-Unhinted 阶段完成后中止构建。未微调的字体在大多数现代渲染环境中已可正常使用。

## 输出字体命名

| 原名 | 现名 |
|---|---|
| Sarasa Gothic | Sarasa Adwaita Gothic |
| Sarasa UI | Sarasa Adwaita UI |
| Sarasa Mono | Sarasa Adwaita Mono |

文件名前缀统一为 `SarasaAdwaita`，例如：`SarasaAdwaitaGothicSC-Regular.ttf`。

## 故障排除

- **otc2otf 未找到**：安装 Python AFDKO 包（`pip install afdko`）
- **OOM 被杀**：减少 hinting 并行度（修改 verdafile.mjs 中的 `os.cpus().length` 上限）
- **构建卡在 clone**：检查网络连接，确保可访问 GitHub

## 参考链接

- [Sarasa Gothic](https://github.com/be5invis/Sarasa-Gothic)
- [Adwaita Fonts](https://gitlab.gnome.org/GNOME/adwaita-fonts)
- [Iosevka](https://github.com/be5invis/Iosevka)
- [Inter](https://github.com/rsms/inter)
