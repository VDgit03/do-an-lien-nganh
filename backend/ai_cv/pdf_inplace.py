"""
pdf_inplace.py - Engine 1: sửa chữ NGAY TRONG PDF gốc (PyMuPDF).

Với mỗi thay đổi {id, original, new:[...]}:
    1. Tìm các dòng chữ của bullet gốc trên trang (khớp chính xác, hoặc gần đúng >= 93%).
    2. Thử chèn bản mới vào một PDF tạm cùng kích thước để biết có VỪA khung không.
       Không vừa -> bỏ qua, KHÔNG xoá gì ở PDF thật (để engine dựng lại xử lý).
    3. Xoá chữ cũ (redact, không tô nền) rồi chèn chữ mới đúng vị trí.
    4. Đọc lại vùng đó để xác nhận chữ mới đã nằm trong PDF.

Giới hạn: PDF phải có lớp chữ (không phải ảnh scan). Bản mới dài hơn nhiều sẽ bị co chữ
tối đa tới 75% hoặc bị bỏ qua nếu vẫn không vừa.
"""

import difflib
import html as html_lib
import os

try:
    import pymupdf
except ImportError:  # PyMuPDF < 1.24.3
    import fitz as pymupdf

from pdf_common import (BULLET_CHARS, BULLET_PREFIX_RE, find_body_start,
                        find_unicode_font, looks_personal, norm)

SCALE_LOW = 0.75       # co chữ tối đa còn 75%
MAX_WINDOW = 10        # một bullet trải tối đa 10 dòng
MATCH_RATIO = 0.93


def _collect_lines(page):
    out = []
    data = page.get_text("dict")
    for bi, block in enumerate(data.get("blocks", [])):
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            spans = [s for s in line.get("spans", []) if s["text"].strip()]
            if not spans:
                continue
            raw = "".join(s["text"] for s in spans)
            stripped = BULLET_PREFIX_RE.sub("", raw)
            had_bullet = len(stripped) < len(raw.lstrip()) or raw.lstrip()[:1] in BULLET_CHARS
            x0, _, x1, _ = spans[0]["bbox"]
            # vị trí bắt đầu phần chữ (sau ký tự bullet), ước lượng theo tỉ lệ ký tự
            cut = len(raw) - len(raw.lstrip()) if not had_bullet else len(raw) - len(stripped)
            first = spans[0]
            if had_bullet and cut > 0:
                if len(first["text"]) > cut:  # bullet nằm chung span với chữ
                    width = first["bbox"][2] - first["bbox"][0]
                    x0 = first["bbox"][0] + width * cut / len(first["text"])
                elif len(spans) > 1:           # bullet là span riêng
                    x0 = spans[1]["bbox"][0]
            body = next((s for s in spans if s["text"].strip(BULLET_CHARS + " ")), first)
            out.append({
                "b": bi,
                "text": stripped.strip(),
                "bullet": had_bullet,
                "rect": pymupdf.Rect(line["bbox"]),
                "x0": x0,
                "size": body["size"],
                "color": body["color"],
                "flags": body["flags"],
                "font": body["font"],
            })
    return out


def _find_lines(lines, original, taken):
    target = norm(original)
    if not target:
        return None
    best = None
    for i in range(len(lines)):
        if i in taken:
            continue
        acc = ""
        for j in range(i, min(len(lines), i + MAX_WINDOW)):
            if j in taken or lines[j]["b"] != lines[i]["b"]:
                break
            acc = (acc + " " + lines[j]["text"]).strip()
            a = norm(acc)
            if a == target:
                return list(range(i, j + 1))
            if len(a) > len(target) * 1.15:
                break
            if len(a) >= len(target) * 0.85:
                ratio = difflib.SequenceMatcher(None, a, target).ratio()
                if ratio >= MATCH_RATIO and (best is None or ratio > best[0]):
                    best = (ratio, i, j)
    return list(range(best[1], best[2] + 1)) if best else None


def _plan_rect(lines, idxs, all_lines):
    """Khung chứa bullet: từ đầu chữ -> mép phải khối, kéo dài xuống phần trống bên dưới."""
    sel = [lines[i] for i in idxs]
    block_lines = [l for l in all_lines if l["b"] == sel[0]["b"]]
    x0 = min(l["x0"] for l in sel)
    x1 = max(l["rect"].x1 for l in block_lines)
    y0 = sel[0]["rect"].y0
    y1 = sel[-1]["rect"].y1
    erase = pymupdf.Rect(x0 - 0.5, y0, x1, y1)

    chosen = set(idxs)
    below = [
        l["rect"].y0 for k, l in enumerate(all_lines)
        if k not in chosen and l["rect"].y0 >= y1 - 1
        and l["rect"].x0 < x1 and l["rect"].x1 > x0
    ]
    line_h = max(sel[0]["size"] * 1.25, 8)
    room = (min(below) - 2 - y1) if below else line_h * 3
    grow = max(0.0, min(room, line_h * 3))
    return erase, pymupdf.Rect(x0, y0, x1, y1 + grow)


def _style(sel, font_path):
    first = sel[0]
    size = round(first["size"], 2)
    if len(sel) > 1:
        pitch = (sel[-1]["rect"].y0 - sel[0]["rect"].y0) / (len(sel) - 1)
        lh = max(1.0, min(1.6, pitch / size))
    else:
        lh = 1.2
    color = "#%06x" % first["color"]
    css = "p{margin:0;}"
    family = "serif" if (first["flags"] & 4) else "sans-serif"
    archive = None
    if font_path:
        archive = pymupdf.Archive(os.path.dirname(font_path))
        css = "@font-face{font-family:cvfont;src:url(%s);}" % os.path.basename(font_path) + css
        family = "cvfont"
    css += "*{font-family:%s;font-size:%spt;color:%s;line-height:%.2f;}" % (family, size, color, lh)
    return css, archive


def _html(bullets, had_bullet):
    parts = []
    for k, text in enumerate(bullets):
        prefix = "\u2022 " if (k > 0 and had_bullet) else ""
        parts.append("<p>%s%s</p>" % (prefix, html_lib.escape(text)))
    return "".join(parts)


def _fits(rect, body, css, archive):
    tmp = pymupdf.open()
    page = tmp.new_page(width=rect.width + 40, height=rect.height + 40)
    spare, scale = page.insert_htmlbox(
        pymupdf.Rect(0, 0, rect.width, rect.height), body,
        css=css, archive=archive, scale_low=SCALE_LOW,
    )
    tmp.close()
    return spare >= 0, scale


def apply_inplace(pdf_path, changes, out_path):
    """Trả về {"applied": [...], "failed": [...]} và ghi PDF mới ra out_path."""
    doc = pymupdf.open(pdf_path)
    if doc.needs_pass:
        doc.close()
        raise ValueError("PDF có mật khẩu, không sửa được.")

    font_path = find_unicode_font()
    pending = {c["id"]: c for c in changes}
    reasons = {c["id"]: "not_found" for c in changes}
    applied = []

    for page in doc:
        lines = _collect_lines(page)
        taken, plans = set(), []

        # Vùng thông tin cá nhân (trên trang 1, phía trên mục đầu tiên như About/Summary):
        # tuyệt đối không sửa.
        limit_y = None
        if page.number == 0:
            start = find_body_start([l["text"] for l in lines])
            if start is not None:
                limit_y = lines[start]["rect"].y0

        for cid, change in list(pending.items()):
            idxs = _find_lines(lines, change["original"], taken)
            if not idxs:
                continue
            sel = [lines[i] for i in idxs]
            if looks_personal(change["original"]) or (
                limit_y is not None and sel[0]["rect"].y0 < limit_y - 1
            ):
                reasons[cid] = "personal_zone"
                del pending[cid]
                continue
            reasons[cid] = "no_fit"
            erase, box = _plan_rect(lines, idxs, lines)
            css, archive = _style(sel, font_path)
            body = _html(change["new"], sel[0]["bullet"])
            ok, scale = _fits(box, body, css, archive)
            if not ok:
                continue
            if any(erase.intersects(p["erase"]) for p in plans):
                reasons[cid] = "overlap"
                continue
            taken.update(idxs)
            plans.append({"id": cid, "erase": erase, "box": box, "css": css,
                          "archive": archive, "body": body, "scale": scale,
                          "new": change["new"]})
            del pending[cid]

        if not plans:
            continue

        for p in plans:
            page.add_redact_annot(p["erase"], fill=False)
        try:
            page.apply_redactions(images=0, graphics=0)
        except TypeError:  # PyMuPDF cũ chưa có tham số graphics
            page.apply_redactions(images=0)

        for p in plans:
            page.insert_htmlbox(p["box"], p["body"], css=p["css"],
                                archive=p["archive"], scale_low=SCALE_LOW)
            got = norm(page.get_text("text", clip=p["box"]))
            expect = norm(p["new"][0])[:20]
            applied.append({
                "id": p["id"],
                "page": page.number + 1,
                "scale": round(p["scale"], 2),
                "verified": expect in got,
            })

    if applied:
        doc.save(out_path, garbage=3, deflate=True)
    doc.close()

    failed = [{"id": cid, "reason": reasons[cid]} for cid in reasons
              if cid in pending or reasons[cid] == "personal_zone"]
    return {"applied": applied, "failed": failed}
