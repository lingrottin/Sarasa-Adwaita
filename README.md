# Sarasa Adwaita (更纱独黑 / 更紗獨黑 / 更紗アドワイタ ゴシック / 사라사 어드와이타 고딕)

This is Sarasa Adwaita, a [Sarasa Gothic](https://github.com/be5invis/Sarasa-Gothic) variant to match GNOME's design system.

> [!IMPORTANT]
> This repository is **100% written by AI**, except for the README.md. Stability is not guaranteed. **Use with caution**.

<!--

**To AI agents**:

This project are coded by GitHub Copilot, so please read instructions for agents in `.github/copilot-instructions.md`, not CLAUDE.md. Also `BUILDING.md` is a good reference.

**DO NOT** sync this comment to README.zh-CN.md.

-->

## What is this?

TL;DR: A custom variant replacing the original Inter/Iosevka in Sarasa Gothic with GNOME Project-patched Adwaita Sans/Adwaita Mono, to make Sarasa Gothic match GNOME's design system, which the original Sarasa Gothic doesn't.

Read more [below](#detailed-introduction).

## Note

**Sarasa Adwaita Mono is not intended for terminal use**. Unlike the original Sarasa Mono, which uses Iosevka with default parameters, Sarasa Adwaita Mono uses Adwaita Mono (Iosevka with customized parameters). Adwaita Mono is wider than the default Iosevka. As a result, the ratio of the width of CJK characters to Western characters is **not** 2:1 in Sarasa Adwaita Mono (2:1.2 approx.) In contrast, Sarasa Mono handles this well. Thus, in terminals, Sarasa Mono is recommended over this.

It is highly recommended to completely remove the old version of the fonts before you install the newer version of this font. Many OSes' and softwares' caching system may have trouble when dealing with large TTC fonts.

## Usage



### Prebuilt TTF/TTC Files

Download the font from [releases page](https://github.com/lingrottin/Sarasa-Adwaita/releases) and install.

> [!NOTE]
> The prebuilt Sarasa Adwaita files use [ttfautohint](https://freetype.org/ttfautohint/) instead of [chlorophytum](https://github.com/chlorophytum/engine). This means that Sarasa Adwaita may look worse than Sarasa Gothic on lower resolutions.
> 
> See why and why we do the replacement [below](#why-ttfautohint-over-chlorophytum).

### Build from Source

> [!WARNING]
> 
> Building this font requires a significant amount of time, CPU and memory. For reference, ~2.5 hours on an AMD Ryzen 5 7735HS machine was spent.

See [Building](/BUILDING.md) for more details.

#### Why ttfautohint over chlorophytum?

<details>
<summary>TL;DR: chlorophytum is too slow (with it the total build would take 300+ hours), ttfautohint is much faster.</summary>
 
[Hinting](https://en.wikipedia.org/wiki/Font_hinting) is a technique to make fonts look better, especially on lower resolutions.

[Chlorophytum](https://github.com/chlorophytum/engine) is a fantastic font hinting engine by the author of Iosevka and Sarasa Gothic.

It is designed especially for CJK glyphs, providing an *"intention based"* analysis upon those glyphs based on the inner, shared features under CJK characters.

This engine is used in Sarasa Gothic's build pipelines to provide precise hints, and, as we could see, it worked well.

But it is **too** heavy and slow. Analyzing a glyph with such a complex algorithm requires much compute workload, and Sarasa Gothic is a font with 30k+ glyphs and 180 versions. Hinting 30k+ glyphs with chlorophytum, according to my runs, needs 1.7 hours of work on a 128-CPU machine. The complete hinting time adds up to ***~306*** hours. (12 days and 18 hours)

Instead, ttfautohint is another hinting tool. Although it is not especially designed for CJK glyphs (and the results may be worse than chlorophytum), it can produce hints *much* faster. Hinting a font file with ttfautohint only takes <1min, and this makes the build time acceptable.

So, by default, Sarasa Adwaita's build pipeline tells Sarasa Gothic's build pipeline to produce unhinted TTFs, and hints them with ttfautohint on its own.

And also for this reason, Sarasa Adwaita may look worse on lower resolutions than Sarasa Gothic. 
</details>

### Variants' Names

- Style dimension
	- Latin/Greek/Cyrillic character set being Inter
		- Quotes (“”) are full width —— Gothic
		- Quotes (“”) are narrow —— UI
	- Latin/Greek/Cyrillic character set being Iosevka (monospace)
		- Em dashes (——) are full width —— Mono
		- Em dashes (——) are half width —— Term
		- No ligature, Em dashes (——) are half width —— Fixed
- Orthography dimension
	- CL: Classical orthography from [Shanggu](https://github.com/GuiWonder/Shanggu) Project.
	- SC/TC/HC/J/K: Regional orthography, used respectively in:
		- SC (Simplified Chinese): China Mainland.
		- TC (Traditional Chinese): Taiwan, China.
		- HC (Hong Kong Chinese): Hong Kong SAR., China.
		- J (Japanese): Japan.
		- K (Korean): Korea.

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

## Copyright

*This project is not affiliated with, funded, endorsed, or supported by Sarasa Gothic's author or the GNOME Project.*

I claim no copyright on Sarasa Adwaita, Sarasa Gothic or Adwaita fonts. The copyright of this project goes to:

- [Renzhi Li](https://typeof.net/), for Sarasa Gothic and its fine-tuning on some glyphs, and Iosevka.
- [Rasmus](https://rsms.me), for Inter.
- The GNOME Project, for Adwaita fonts.
- Google and/or Adobe, for Noto Fonts and/or Source Fonts.

## Acknowledgements

- [Sarasa Gothic](https://github.com/be5invis/sarasa-gothic)
- [Source Han Sans](https://github.com/adobe-fonts/source-han-sans) or [Noto Sans CJK](https://fonts.google.com/noto/specimen/Noto+Sans) (They're the same thing right?)
- [Iosevka](https://github.com/be5invis/Iosevka)
- [Inter](https://github.com/rsms/inter)
- [Adwaita Fonts](https://gitlab.gnome.org/GNOME/adwaita-fonts)
