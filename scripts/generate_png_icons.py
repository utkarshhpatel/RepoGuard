#!/usr/bin/env python3
"""
Generates valid PNG icons for RepoGuard PWA and Linux desktop entry.
Pure Python standard library (struct + zlib) - zero external dependencies required.
"""
import math
import os
import struct
import zlib

def create_png(width: int, height: int, pixels: bytes) -> bytes:
    """Encodes RGBA raw pixel data into a standard valid PNG binary."""
    # PNG signature
    png = b"\x89PNG\r\n\x1a\n"

    # IHDR chunk: width(4), height(4), bit_depth(1), color_type(1=RGBA 6), comp(1), filter(1), interlace(1)
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    ihdr_crc = zlib.crc32(b"IHDR" + ihdr_data) & 0xFFFFFFFF
    png += struct.pack(">I", len(ihdr_data)) + b"IHDR" + ihdr_data + struct.pack(">I", ihdr_crc)

    # Scanlines with filter byte 0 (None)
    raw_scanlines = bytearray()
    row_bytes = width * 4
    for y in range(height):
        raw_scanlines.append(0)  # filter type 0
        raw_scanlines.extend(pixels[y * row_bytes : (y + 1) * row_bytes])

    # IDAT chunk
    compressed = zlib.compress(bytes(raw_scanlines), level=9)
    idat_crc = zlib.crc32(b"IDAT" + compressed) & 0xFFFFFFFF
    png += struct.pack(">I", len(compressed)) + b"IDAT" + compressed + struct.pack(">I", idat_crc)

    # IEND chunk
    iend_crc = zlib.crc32(b"IEND") & 0xFFFFFFFF
    png += struct.pack(">I", 0) + b"IEND" + struct.pack(">I", iend_crc)

    return bytes(png)


def point_in_polygon(x: float, y: float, poly: list[tuple[float, float]]) -> bool:
    """Ray casting algorithm to determine if point (x, y) is inside polygon."""
    inside = False
    n = len(poly)
    p1x, p1y = poly[0]
    for i in range(1, n + 1):
        p2x, p2y = poly[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside


def dist_to_segment(px: float, py: float, x1: float, y1: float, x2: float, y2: float) -> float:
    """Distance from point (px, py) to line segment (x1, y1)-(x2, y2)."""
    dx = x2 - x1
    dy = y2 - y1
    if dx == 0 and dy == 0:
        return math.hypot(px - x1, py - y1)
    t = max(0.0, min(1.0, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)))
    proj_x = x1 + t * dx
    proj_y = y1 + t * dy
    return math.hypot(px - proj_x, py - proj_y)


def render_icon(size: int, is_maskable: bool = False) -> bytes:
    """Renders RepoGuard icon at given pixel dimension."""
    pixels = bytearray(size * size * 4)

    # Normalization scale factor
    scale = size / 512.0

    # Outer rounded background
    corner_r = (0 if is_maskable else 108) * scale

    # Outer shield points (normalized to 512x512)
    outer_shield = [
        (256 * scale, 70 * scale),
        (390 * scale, 130 * scale),
        (390 * scale, 245 * scale),
        (256 * scale, 445 * scale),
        (122 * scale, 245 * scale),
        (122 * scale, 130 * scale),
    ]

    inner_shield = [
        (256 * scale, 95 * scale),
        (370 * scale, 148 * scale),
        (370 * scale, 245 * scale),
        (256 * scale, 420 * scale),
        (142 * scale, 245 * scale),
        (142 * scale, 148 * scale),
    ]

    # Checkmark segments
    seg1 = (195 * scale, 255 * scale, 238 * scale, 298 * scale)
    seg2 = (238 * scale, 298 * scale, 318 * scale, 205 * scale)
    stroke_w = 24.0 * scale

    for y in range(size):
        for x in range(size):
            idx = (y * size + x) * 4

            # Rounded rect test for background
            in_bg = True
            if not is_maskable:
                # check corners
                if x < corner_r and y < corner_r:
                    in_bg = math.hypot(x - corner_r, y - corner_r) <= corner_r
                elif x > size - corner_r and y < corner_r:
                    in_bg = math.hypot(x - (size - corner_r), y - corner_r) <= corner_r
                elif x < corner_r and y > size - corner_r:
                    in_bg = math.hypot(x - corner_r, y - (size - corner_r)) <= corner_r
                elif x > size - corner_r and y > size - corner_r:
                    in_bg = math.hypot(x - (size - corner_r), y - (size - corner_r)) <= corner_r

            if not in_bg:
                pixels[idx : idx + 4] = b"\x00\x00\x00\x00"
                continue

            # Base gradient: #18212B to #0B0F14
            t = y / size
            bg_r = int(24 * (1 - t) + 11 * t)
            bg_g = int(33 * (1 - t) + 15 * t)
            bg_b = int(43 * (1 - t) + 20 * t)
            r, g, b, a = bg_r, bg_g, bg_b, 255

            # Outer shield test
            in_outer = point_in_polygon(x, y, outer_shield)
            in_inner = point_in_polygon(x, y, inner_shield)

            if in_outer:
                if not in_inner:
                    # Emerald border gradient (#34D399 to #059669)
                    st = y / size
                    r = int(52 * (1 - st) + 5 * st)
                    g = int(211 * (1 - st) + 150 * st)
                    b = int(153 * (1 - st) + 105 * st)
                else:
                    # Inner shield panel (#111821)
                    r, g, b = 17, 24, 33

            # Checkmark stroke
            d1 = dist_to_segment(x, y, seg1[0], seg1[1], seg1[2], seg1[3])
            d2 = dist_to_segment(x, y, seg2[0], seg2[1], seg2[2], seg2[3])
            d = min(d1, d2)

            if d <= stroke_w / 2.0:
                # Anti-aliased checkmark (#34D399)
                edge_t = min(1.0, max(0.0, (stroke_w / 2.0 - d) + 0.5))
                cr, cg, cb = 52, 211, 153
                r = int(cr * edge_t + r * (1 - edge_t))
                g = int(cg * edge_t + g * (1 - edge_t))
                b = int(cb * edge_t + b * (1 - edge_t))

            pixels[idx : idx + 4] = bytes([r, g, b, a])

    return create_png(size, size, bytes(pixels))


def main():
    icons_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "icons")
    )
    os.makedirs(icons_dir, exist_ok=True)

    print(f"Generating icons in {icons_dir}...")

    # 192x192
    p192 = render_icon(192)
    path192 = os.path.join(icons_dir, "icon-192.png")
    with open(path192, "wb") as f:
        f.write(p192)
    print(f"Created {path192} ({len(p192)} bytes)")

    # 512x512
    p512 = render_icon(512)
    path512 = os.path.join(icons_dir, "icon-512.png")
    with open(path512, "wb") as f:
        f.write(p512)
    print(f"Created {path512} ({len(p512)} bytes)")

    # 512x512 maskable
    p512m = render_icon(512, is_maskable=True)
    path512m = os.path.join(icons_dir, "icon-512-maskable.png")
    with open(path512m, "wb") as f:
        f.write(p512m)
    print(f"Created {path512m} ({len(p512m)} bytes)")

    print("Icons successfully generated.")


if __name__ == "__main__":
    main()
