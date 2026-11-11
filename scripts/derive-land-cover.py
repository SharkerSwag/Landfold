"""Sample Figure 1c's published map colors. Regeneration requires Pillow."""
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1] / "docs"
source = Image.open(root / "assets/quanfuzhuang-map.png").convert("RGB")
assert source.size == (4064, 1790)
# Rectangle containing the detailed land-use inset, in source-image pixels.
crop = [2154, 250, 3998, 1714]
# Trace the black border of the detailed inset in a 2048 × 902 reference view.
# This mask excludes the separate basin overview, legend and margin.
outline_reference = [
    (1088, 468), (1180, 424), (1214, 409), (1225, 371),
    (1246, 349), (1274, 336), (1307, 333), (1328, 301),
    (1361, 245), (1386, 200), (1413, 152), (1440, 136),
    (1464, 132), (1501, 138), (1550, 155), (1620, 164),
    (1712, 176), (1750, 178), (1805, 161), (1880, 152),
    (1934, 154), (1962, 178), (2012, 211), (2012, 860), (1088, 860),
]
outline = [(x * 4064 / 2048, y * 1790 / 902) for x, y in outline_reference]
columns, rows = 192, 152
palette = {"t": (110, 220, 243), "f": (73, 180, 112),
           "v": (244, 159, 99), "o": (180, 180, 180)}

def classify(pixel):
    error, name = min(
        (sum((a - b) ** 2 for a, b in zip(pixel, color)), name)
        for name, color in palette.items()
    )
    return name if error <= 24 ** 2 else "?"

def inside_inset(x, y):
    inside = False
    for (x0, y0), (x1, y1) in zip(outline, outline[1:] + outline[:1]):
        if (y0 > y) != (y1 > y) and x < x0 + (y - y0) * (x1 - x0) / (y1 - y0):
            inside = not inside
    return inside

def sample(column, row):
    x = int(crop[0] + (column + .5) / columns * (crop[2] - crop[0]))
    y = int(crop[1] + (row + .5) / rows * (crop[3] - crop[1]))
    return classify(source.getpixel((x, y))) if inside_inset(x, y) else "?"

grid = ["".join(sample(x, y) for x in range(columns)) for y in range(rows)]
mask = [
    [round((x - crop[0]) / (crop[2] - crop[0]), 5),
     round((y - crop[1]) / (crop[3] - crop[1]), 5)]
    for x, y in outline
]
(root / "land-cover.js").write_text(
    "export const inset = " + json.dumps(crop) + ";\n"
    "export const outline = " + json.dumps(mask) + ";\n"
    "export const landCover = [\n" +
    "".join(f"  {json.dumps(row)},\n" for row in grid) + "];\n",
    encoding="utf-8",
)
