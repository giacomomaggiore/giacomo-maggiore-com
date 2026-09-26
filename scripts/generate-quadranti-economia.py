from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib import font_manager
from matplotlib.patches import FancyArrowPatch, Patch


OUTPUT_PATH = Path(__file__).resolve().parents[1] / "public/images/blog/quadranti-economia.jpg"
FONT_PATH = Path(__file__).resolve().parent / "fonts/Roboto-VariableFont_wdth,wght.ttf"
BACKGROUND = "#ffffff"
TEXT = "#000000"
MUTED_TEXT = "#000000"
COLORS = {
    "Equities": "#303b4c",
    "Bonds": "#1ec6a8",
    "Gold": "#3b6b9f",
    "Commodities": "#7fa5cb",
    "Trend Following": "#92e478",
}


def draw_regime(ax, title, date_range, values, bottom_left, title_y, date_y, label_offsets=None, scale=0.35):
    """Draw one five-asset return cluster in a chart quadrant."""
    label_offsets = label_offsets or {}
    left, baseline = bottom_left
    bar_width = 5
    gap = 3
    assets = list(COLORS)

    ax.text(left + 14, title_y, title, color=TEXT, fontsize=17, ha="center")
    ax.text(left + 14, date_y, date_range, color=MUTED_TEXT, fontsize=11, ha="center")

    for index, (asset, value) in enumerate(zip(assets, values)):
        x_pos = left + index * (bar_width + gap)
        height = abs(value) * scale
        bar_bottom = baseline if value >= 0 else baseline - height
        ax.bar(x_pos, height, width=bar_width, bottom=bar_bottom, color=COLORS[asset], align="edge")
        offset_x, offset_y = label_offsets.get(index, (0, 0))
        label_y = bar_bottom + height + 1.8 if value >= 0 else bar_bottom - 2.3
        ax.text(
            x_pos + bar_width / 2 + offset_x,
            label_y + offset_y,
            f"{value}%",
            color=MUTED_TEXT,
            fontsize=10,
            ha="center",
            va="bottom" if value >= 0 else "top",
        )


def main():
    font_manager.fontManager.addfont(FONT_PATH)
    plt.rcParams.update({"font.family": "Roboto", "font.weight": "normal"})
    figure, ax = plt.subplots(figsize=(16, 11.2), dpi=100, facecolor=BACKGROUND)
    ax.set_facecolor(BACKGROUND)
    figure.subplots_adjust(left=0.015, right=0.985, bottom=0.07, top=0.98)
    ax.set_xlim(0, 160)
    ax.set_ylim(0, 112)
    ax.axis("off")

    arrow_style = dict(arrowstyle="-|>", mutation_scale=18, linewidth=2.8, color=TEXT)
    ax.add_patch(FancyArrowPatch((15, 56), (145, 56), **arrow_style))
    ax.add_patch(FancyArrowPatch((80, 12), (80, 108), **arrow_style))
    ax.add_patch(FancyArrowPatch((80, 56), (15, 56), **arrow_style))
    ax.add_patch(FancyArrowPatch((80, 56), (80, 12), **arrow_style))

    ax.text(1.5, 56, "Slowing\nGrowth", color=TEXT, fontsize=15, ha="left", va="center")
    ax.text(158.5, 56, "Accelerating\nGrowth", color=TEXT, fontsize=15, ha="right", va="center")
    ax.text(80, 111, "Rising Inflation", color=TEXT, fontsize=15, ha="center", va="top")
    ax.text(80, 2, "Falling Inflation", color=TEXT, fontsize=15, ha="center", va="bottom")

    draw_regime(
        ax,
        "Inflationary Stagnation",
        "Dec 31, 2021 to Oct 24, 2022",
        [-12, -40, 7, 21, 30],
        (28, 78),
        101,
        97,
        scale=0.44,
    )
    draw_regime(
        ax,
        "Inflationary Boom",
        "Dec 10, 2001 to July 08, 2008",
        [-8, 6, 22, 44, 7],
        (94, 66),
        101,
        97,
        {0: (0, -0.8)},
        scale=0.55,
    )
    draw_regime(
        ax,
        "Deflationary Bust",
        "Oct 10, 2007 to Mar 09, 2009",
        [-48, 25, 24, -17, 19],
        (28, 29),
        48,
        44,
        scale=0.36,
    )
    draw_regime(
        ax,
        "Disinflationary Boom",
        "Jan 01, 2012 to Jan 31, 2020",
        [12, 48, -2, -14, 1],
        (94, 22),
        48,
        42,
        {0: (0, -1.4)},
        scale=0.34,
    )

    legend = ax.legend(
        handles=[Patch(facecolor=color, label=asset) for asset, color in COLORS.items()],
        loc="lower center",
        bbox_to_anchor=(0.5, -0.06),
        ncol=5,
        frameon=False,
        fontsize=13,
        handlelength=1.4,
        handleheight=1.4,
        handletextpad=0.5,
        columnspacing=2.2,
    )
    for label in legend.get_texts():
        label.set_color(MUTED_TEXT)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    figure.savefig(OUTPUT_PATH, format="jpg", dpi=100, facecolor=BACKGROUND)


if __name__ == "__main__":
    main()