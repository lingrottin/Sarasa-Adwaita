# Sarasa Adwaita（更纱独黑 / 更紗獨黑 / 更紗アドワイタ ゴシック / 사라사 어드와이타 고딕）

这是 Sarasa Adwaita，一款为了匹配 GNOME 设计系统而制作的 [Sarasa Gothic](https://github.com/be5invis/Sarasa-Gothic) 变体。

> [!IMPORTANT]
> 本仓库**除 README.md 外 100% 由 AI 编写**。稳定性不作保证。**请谨慎使用**。

## 这是什么？

TL;DR: 将 Sarasa Gothic 原版中的 Inter/Iosevka 字体替换为 GNOME 项目定制的 Adwaita Sans/Adwaita Mono，使 Sarasa Gothic 匹配 GNOME 设计系统。

详见下文[详细介绍](#详细介绍)。

## 注意事项

**Sarasa Adwaita Mono 不推荐在终端中使用**。原版 Sarasa Mono 使用默认参数的 Iosevka，而 Sarasa Adwaita Mono 使用 Adwaita Mono（经定制的 Iosevka）。Adwaita Mono 比默认 Iosevka 更宽，导致中英文宽度之比在 Sarasa Adwaita Mono 中**不**是 2:1（而是约 2:1.2）。原版 Sarasa Mono 在此方面表现更好，因此终端场景仍推荐 Sarasa Mono。

强烈建议在安装新版本字体前完全移除旧版本。许多操作系统和软件在处理大型 TTC 字体时缓存系统可能出现问题。

## 使用方法

### 预构建 TTF/TTC 文件

~~从 [releases 页面](https://github.com/lingrottin/Sarasa-Adwaita/releases) 下载并安装。~~ *（暂未提供！）*

### 从源码构建

> [!WARNING]
>
> 构建本字体需要**极大的**时间、CPU 和内存资源。我为此租用了一台 128 核 CPU、128GB 内存的服务器，耗时数小时，截至本文写作时仍未跑完！构建过程中甚至触发了 OOM killer。
>
> 好在主要计算量在 hinting（字体微调）阶段，它是对**已生成**的字体进行分析并产生 hint 数据。如果不需要 [hinting](https://en.wikipedia.org/wiki/Font_hinting)，可以在看到大量 `SarasaAdwaita***.ttf` 出现在 `target/work/Sarasa-Gothic/out/TTF-Unhinted` 后中止构建。但即便如此，在此之前仍需花费大量时间和算力。

详见 [构建指南](/BUILDING.zh-CN.md)。

### 字体名称说明

- 按风格
  - 拉丁/希腊/西里尔字符集为 Inter
    - 引号（“”）为全宽——Gothic
    - 引号（“”）为窄宽——UI
  - 拉丁/希腊/西里尔字符集为 Iosevka
    - 破折号（——）为全宽——Mono
    - 破折号（——）为半宽——Term
    - 无连字，破折号（——）为半宽——Fixed
- 按区域
  - CL: 传统字形
  - SC, TC, J, K, HC: 区域字形，遵循 [Source Han Sans](https://github.com/adobe-fonts/source-han-sans) 命名约定

## 详细介绍

### 背景

[Sarasa Gothic](https://github.com/be5invis/Sarasa-Gothic) 是一款将 Noto CJK 字体中的西文部分替换为 [Inter](https://rsms.me/inter) 和 [Iosevka](https://typeof.net/Iosevka/) 字形的字体。

[Adwaita 字体系列](https://gitlab.gnome.org/GNOME/adwaita-fonts)（包含 Adwaita Sans 和 Adwaita Mono）是 GNOME 项目的 Inter 和 Iosevka 定制版本，自 GNOME 48 起作为默认字体。

虽然 Sarasa Gothic 的西文部分本质上就是 Inter 和 Iosevka（也就是 Adwaita 字体的基础），但 Sarasa Gothic 并不完全匹配 GNOME 桌面的风格。尤其是等宽变体 Sarasa Mono——其西文字形偏窄、偏高、偏"极客风"，而 Adwaita Mono 明显更宽、更温暖。

这是因为 Iosevka 是一款**高度可定制**的变量字体。为了使 Adwaita Mono 看起来像"Adwaita Sans（即 Inter）的等宽版本"，GNOME 团队在 Iosevka 上做了大量定制。而 Sarasa Gothic 使用 Iosevka 的默认参数，移除了其定制能力，直接捆绑。最终结果是 Sarasa Mono 与 Adwaita Mono 看起来**差异显著**。

### 目标

由于 Adwaita 字体本身就是 Inter 和 Iosevka 的变体，它们应该可以无缝替换 Sarasa Gothic 构建管线中的 Inter 和 Iosevka，从而生成一款具有 GNOME 风格西文字形的定制 Sarasa Gothic。

本项目是一个自动化构建脚本，能够从 Inter/Iosevka 构建 Adwaita Sans 和 Mono，将其放入 Sarasa Gothic 的构建管线，最终从源码构建出完整的 Sarasa Gothic。

我将这款 GNOME 风格的 Sarasa Gothic 命名为 **Sarasa Adwaita**。

### 关于名称

"Adwaita" 是 GNOME 设计系统的名称。因此将本项目命名为 "Sarasa Adwaita" 很自然。

Adwaita 一词来自梵语，意为"独一无二的"。

本字体的中文名"更纱**独**黑"基本是英文名的直译，其中"Adwaita"取其梵语原意。

## 致谢

- [Sarasa Gothic](https://github.com/be5invis/sarasa-gothic)
- [Source Han Sans](https://github.com/adobe-fonts/source-han-sans) 或 [Noto Sans CJK](https://fonts.google.com/noto/specimen/Noto+Sans)（它们本质上是同一个东西，对吧？）
- [Iosevka](https://github.com/be5invis/Iosevka)
- [Inter](https://github.com/rsms/inter)
- [Adwaita Fonts](https://gitlab.gnome.org/GNOME/adwaita-fonts)
