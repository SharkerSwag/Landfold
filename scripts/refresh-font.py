"""Refresh the self-hosted Chinese serif subset after editorial text changes.

Uses Python's standard library and the official Google Fonts CSS service.
This is an editorial maintenance task, not a build or startup requirement.
"""

import hashlib
import pathlib
import re
import urllib.parse
import urllib.request

root = pathlib.Path(__file__).resolve().parents[1]
text = "".join(
    (root / "docs" / filename).read_text(encoding="utf-8-sig")
    for filename in ["index.html", "content.js", "app.js"]
)
characters = "".join(sorted(set(re.findall(r"[\u3000-\u9fff\uff00-\uffef]", text))))
css_url = (
    "https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400&display=swap&text="
    + urllib.parse.quote(characters)
)


def fetch(url):
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36"},
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


css = fetch(css_url).decode("utf-8")
font_url = re.search(r"url\(([^)]+)\)", css).group(1)
font = fetch(font_url)
if font[:4] != b"\x00\x01\x00\x00":
    raise RuntimeError("Expected a TrueType font; review the service's returned format.")
license_text = fetch("https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/OFL.txt")
destination = root / "docs" / "assets" / "fonts"
destination.mkdir(exist_ok=True)
(destination / "noto-serif-sc-regular-subset.ttf").write_bytes(font)
(destination / "OFL.txt").write_bytes(license_text)
print(f"Chinese characters: {len(characters)}; font bytes: {len(font)}")
print(f"SHA-256: {hashlib.sha256(font).hexdigest()}")
