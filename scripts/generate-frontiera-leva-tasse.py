from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from matplotlib import font_manager
from matplotlib.patches import Patch


OUTPUT_PATH = Path(__file__).resolve().parents[1] / "public/images/blog/frontiera-leva-tasse.png"
FONT_PATH = Path(__file__).resolve().parent / "fonts/Roboto-VariableFont_wdth,wght.ttf"
BACKGROUND = "#ffffff"
TEXT = "#171717"
MUTED_TEXT = "#5b5b55"
SAFE = "#b9dec8"
UNSAFE = "#efc2bd"
SENSITIVITY = "#e5b95c"
FRONTIER = "#171717"
YIELD_LOW = 1.2
YIELD_BASE = 1.35
YIELD_HIGH = 1.5
MAX_LEVERAGE = 2.5


def frontier(interest_rates, taxable_yield):
    values = np.full_like(interest_rates, np.inf)
    mask = interest_rates > taxable_yield
    values[mask] = interest_rates[mask] / (interest_rates[mask] - taxable_yield)
    return np.minimum(values, MAX_LEVERAGE)


def main():
    font_manager.fontManager.addfont(FONT_PATH)
    plt.rcParams.update({"font.family": "Roboto", "font.weight": "normal"})

    interest_rates = np.linspace(0.01, 8, 1600)
    base_frontier = frontier(interest_rates, YIELD_BASE)
    low_frontier = frontier(interest_rates, YIELD_LOW)
    high_frontier = frontier(interest_rates, YIELD_HIGH)

    figure, ax = plt.subplots(figsize=(16, 10), dpi=100, facecolor=BACKGROUND)
    ax.set_facecolor(BACKGROUND)
    figure.subplots_adjust(left=0.1, right=0.98, bottom=0.12, top=0.98)

    ax.fill_between(interest_rates, 1, base_frontier, color=SAFE, alpha=0.9)
    ax.fill_between(interest_rates, base_frontier, MAX_LEVERAGE, color=UNSAFE, alpha=0.82)
    ax.fill_between(
        interest_rates,
        low_frontier,
        high_frontier,
        color=SENSITIVITY,
        alpha=0.75,
        label="Taxable yield sensitivity",
    )
    ax.plot(interest_rates, base_frontier, color=FRONTIER, linewidth=3.2)

    example_leverage = 1.3
    example_rate = example_leverage / (example_leverage - 1) * YIELD_BASE
    ax.axhline(example_leverage, color=MUTED_TEXT, linewidth=1.4, linestyle=(0, (5, 5)))
    ax.plot(example_rate, example_leverage, "o", color=FRONTIER, markersize=9, zorder=5)
    ax.annotate(
        "At L = 1.3:  i* = 5.85%",
        xy=(example_rate, example_leverage),
        xytext=(example_rate - 0.25, example_leverage + 0.22),
        fontsize=21,
        color=TEXT,
        ha="right",
        arrowprops={"arrowstyle": "->", "color": FRONTIER, "linewidth": 1.5},
    )

    ax.text(
        1.1,
        1.68,
        "CRITERION 4\nSATISFIED",
        color="#1f5d3b",
        fontsize=26,
        fontweight="bold",
        ha="center",
        va="center",
    )
    ax.text(
        6.55,
        2.13,
        "PRELIMINARY EXCLUSION\nNOT GUARANTEED",
        color="#873c35",
        fontsize=26,
        fontweight="bold",
        ha="center",
        va="center",
    )

    ax.set_xlim(0, 8)
    ax.set_ylim(1, MAX_LEVERAGE)
    ax.set_xlabel("Effective annual borrowing cost, i", fontsize=24, color=TEXT, labelpad=16)
    ax.set_ylabel("Explicit leverage, L", fontsize=24, color=TEXT, labelpad=16)
    ax.set_xticks(np.arange(0, 8.1, 1), [f"{value:.0f}%" for value in np.arange(0, 8.1, 1)])
    ax.set_yticks(np.arange(1, 2.51, 0.25), [f"{value:.2f}" for value in np.arange(1, 2.51, 0.25)])
    ax.tick_params(axis="both", colors=MUTED_TEXT, labelsize=20, length=0)
    ax.grid(color="#ffffff", linewidth=1.5, alpha=0.9)
    ax.set_axisbelow(True)
    for spine in ax.spines.values():
        spine.set_visible(False)

    legend = ax.legend(
        handles=[
            Patch(facecolor=SAFE, label="Criterion satisfied"),
            Patch(facecolor=UNSAFE, label="Criterion not guaranteed"),
            Patch(facecolor=SENSITIVITY, label=r"$y_p$ range = 1.2%–1.5%"),
        ],
        loc="upper right",
        frameon=False,
        fontsize=20,
    )
    for label in legend.get_texts():
        label.set_color(TEXT)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    figure.savefig(OUTPUT_PATH, format="png", dpi=100, facecolor=BACKGROUND)
    plt.close(figure)


if __name__ == "__main__":
    main()