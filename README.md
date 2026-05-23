# Sarasa Adwaita (更纱独黑 / 更紗獨黑 / 更紗アドワイタ ゴシック / 사라사 어드와이타 고딕)

This is Sarasa Adwaita, a [Sarasa Gothic](https://github.com/be5invis/Sarasa-Gothic) variant to match GNOME's design system.

> [!IMPORTANT]
> This repository is **100% written by AI**, except for the README.md. Stability is not guaranteed. **Use with caution**.

## What is this?

TL;DR: A custom variant replacing the original Inter/Iosevka in Sarasa Gothic with GNOME Project-patched Adwaita Sans/Adwaita Mono, to make Sarasa Gothic match GNOME's design system, which the original Sarasa Gothic doesn't.

Read more [below](#detailed-introduction).

## Note

**Sarasa Adwaita Mono is not intended for terminal use**. Unlike the original Sarasa Mono, which uses Iosevka with default parameters, Sarasa Adwaita Mono uses Adwaita Mono (Iosevka with customized parameters). Adwaita Mono is wider than the default Iosevka. As a result, the ratio of the width of CJK characters to Western characters is **not** 2:1 in Sarasa Adwaita Mono (but 2:1.2 approx.) In contrast, Sarasa Mono handles this well. Thus, in terminals, Sarasa Mono is recommended over this.

It is highly recommended to completely remove the old version of the fonts before you install the newer version of this font. Many OSes' and softwares' caching system may have trouble when dealing with large TTC fonts.

## Usage

### Prebuilt TTF/TTC Files

~~Download the font from [releases page](https://github.com/lingrottin/Sarasa-Adwaita/releases) and install.~~ *(not available yet!)*

### Build from Source

> [!WARNING]
> 
> To build this font requires ***extremely high*** amount of time, CPU and memory. I rented a 128-vCPU machine with 128GB of memory for this, and it spent *hours* of time and as of writing it has not finished yet! An OOM Killer was even triggered during the process. 
> 
> Luckily, the main workload is in the hinting steps, which analyze the **generated** font and produce hints. If you don't need [hinting](https://en.wikipedia.org/wiki/Font_hinting), you can just terminate the build process once you see hundreds of `SarasaAdwaita***.ttf` appear in `target/work/Sarasa-Gothic/out/TTF-Unhinted`. But this still costs a lot of time and CPU even before hinting though.

See [Building](/BUILDING.md) for more details.

### Variants' Names

- Style dimension
	- Latin/Greek/Cyrillic character set being Inter
		- Quotes (“”) are full width —— Gothic
		- Quotes (“”) are narrow —— UI
	- Latin/Greek/Cyrillic character set being Iosevka
		- Em dashes (——) are full width —— Mono
		- Em dashes (——) are half width —— Term
		- No ligature, Em dashes (——) are half width —— Fixed
- Orthography dimension
	- CL: Classical orthography
	- SC, TC, J, K, HC: Regional orthography, following [Source Han Sans](https://github.com/adobe-fonts/source-han-sans) notations.

## Detailed Introduction

### Background

[Sarasa Gothic](https://github.com/be5invis/Sarasa-Gothic) is a font replacing Western characters in Noto CJK fonts with glyphs from [Inter](https://rsms.me/inter) and [Iosevka](https://typeof.net/Iosevka/).

The [Adwaita Font Family](https://gitlab.gnome.org/GNOME/adwaita-fonts), including Adwaita Sans and Adwaita Mono, is GNOME Project's version of Inter and Iosevka, used as the default font from GNOME 48.

Although the Western part of Sarasa Gothic is basically Inter and Iosevka, which are just what Adwaita fonts are made from, Sarasa Gothic doesn't really match GNOME desktop's style. Especially, the monospaced variant of Sarasa - its Western characters are thin and tall and geeky, while Adwaita Mono is significantly wider and warmer.

That's because Iosevka is a **very** customizable variable font, and to make Adwaita Mono look like the "monospaced version of Adwaita Sans (Inter, actually)", the GNOME team did a lot of customization on Iosevka. But Sarasa Gothic uses Iosevka's default parameters, removing its customization abilities, and bundles it. The final result of that is, Sarasa Mono looks **significantly** different from Adwaita Mono.

### Objective

Since Adwaita fonts are variants of Inter and Iosevka, they should be capable of being a drop-in replacement for Inter and Iosevka in Sarasa Gothic's build pipelines, and then it should produce a custom Sarasa Gothic with GNOME-flavored Western characters.

This project is a automatic build script. It could build Adw. Sans and Mono from Inter/Iosevka, put them into Sarasa Gothic's build pipelines, and finally build Sarasa Gothic from source.

I name this font, the GNOME-flavored Sarasa Gothic, Sarasa Adwaita.

### About the name

"Adwaita" is the name of the GNOME design system. So it is natural to name this project "Sarasa Adwaita".

The word Adwaita comes from Sanskrit and means "The Only".

The Chinese name of this font (更纱*独*黑) is basically a direct translation of the English name, "Sarasa 'Only' Sans-serif", where "Adwaita" is interpreted as its original meanings in Sanskrit.

## Acknowledgements

- [Sarasa Gothic](https://github.com/be5invis/sarasa-gothic)
- [Source Han Sans](https://github.com/adobe-fonts/source-han-sans) or [Noto Sans CJK](https://fonts.google.com/noto/specimen/Noto+Sans) (They're the same thing right?)
- [Iosevka](https://github.com/be5invis/Iosevka)
- [Inter](https://github.com/rsms/inter)
- [Adwaita Fonts](https://gitlab.gnome.org/GNOME/adwaita-fonts)