"""
cv_draft.py - Dựng bản nháp CV (JSON) sau khi áp dụng các chỉnh sửa của AI.

Khác cv_agent.py (ghi thẳng ra PDF), script này chỉ trả về structured_cv đã thay bullet
để frontend cho người dùng chọn mẫu, xem trước và sửa tay trước khi tạo PDF.

    python cv_draft.py --pdf cv.pdf --changes changes.json
    python cv_draft.py --text-file cv.txt --changes changes.json     # CV dạng ảnh (đã OCR)

changes.json: [{"id": "0", "original": "...", "new": ["..."]}]
stdout: đúng MỘT dòng JSON {"success": true, "cv": {...}, "applied": [...], "failed": [...]}
"""

import argparse
import contextlib
import json
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)


def _match(items, original):
    import difflib
    from pdf_common import norm

    target = norm(original)
    for k, text in enumerate(items):
        if norm(text) == target:
            return k
    for k, text in enumerate(items):
        if difflib.SequenceMatcher(None, norm(text), target).ratio() >= 0.93:
            return k
    return None


def apply_changes(cv, changes):
    """Thay bullet trong structured_cv; trả về (applied, failed). Mỗi mục applied có
    "target" = [mục, vị trí entry, vị trí bullet đầu, số bullet mới] để frontend đánh dấu."""
    slots = []
    for key in ("experience", "projects", "education"):
        for e_idx, entry in enumerate(cv.get(key) or []):
            if isinstance(entry.get("description"), list):
                slots.append((key, e_idx, entry["description"]))

    applied, failed = [], []
    for change in changes:
        done = False
        for key, e_idx, items in slots:
            k = _match(items, change["original"])
            if k is not None:
                items[k:k + 1] = [str(x) for x in change["new"]]
                applied.append({"id": change["id"], "section": key, "entry": e_idx,
                                "index": k, "count": len(change["new"])})
                done = True
                break
        if not done:
            failed.append({"id": change["id"], "reason": "not_found"})
    return applied, failed


def extract_photo(pdf_path, max_side=360):
    """Ảnh chân dung (nếu có) ở trang 1 của PDF -> data URL JPEG, hoặc "".

    Chọn ảnh lớn nhất có tỉ lệ gần vuông/chân dung, bỏ qua logo/icon nhỏ và ảnh quá
    rộng (banner). Mọi lỗi đều bỏ qua: không có ảnh vẫn dựng CV bình thường."""
    try:
        import base64
        import pymupdf

        document = pymupdf.open(pdf_path)
        if not len(document):
            return ""

        page = document[0]
        best = None

        for info in page.get_image_info(xrefs=True):
            xref = info.get("xref") or 0
            width, height = info.get("width", 0), info.get("height", 0)
            bbox = pymupdf.Rect(info.get("bbox") or (0, 0, 0, 0))

            if not xref or width < 80 or height < 80:
                continue
            if bbox.width < 40 or bbox.height < 40:
                continue
            ratio = bbox.width / bbox.height if bbox.height else 0
            if not 0.6 <= ratio <= 1.4:
                continue

            area = bbox.width * bbox.height
            if best is None or area > best[0]:
                best = (area, xref)

        if best is None:
            return ""

        pix = pymupdf.Pixmap(document, best[1])
        if pix.alpha or pix.colorspace is None or pix.colorspace.n != 3:
            pix = pymupdf.Pixmap(pymupdf.csRGB, pix)

        scale = max(pix.width, pix.height) / float(max_side)
        if scale > 1:
            pix = pymupdf.Pixmap(pix, int(pix.width / scale), int(pix.height / scale))
        data = pix.tobytes("jpeg", jpg_quality=85)

        return "data:image/jpeg;base64," + base64.b64encode(data).decode("ascii")
    except Exception:  # noqa: BLE001
        return ""


def build_draft(pdf_path, changes, text=None):
    from normalizer import normalize_cv_text
    from structure_cv import build_structured_cv

    if text is not None:
        from analyze_cv import clean_ocr_text
        raw = clean_ocr_text(text)
    else:
        if not pdf_path or not os.path.isfile(pdf_path):
            raise ValueError("Không tìm thấy file CV.")
        from read_cv import extract_text_from_pdf
        raw = extract_text_from_pdf(pdf_path)

    if not raw.strip():
        raise ValueError("Không đọc được chữ từ CV.")

    cv = build_structured_cv(normalize_cv_text(raw))
    applied, failed = apply_changes(cv, changes or [])
    photo = extract_photo(pdf_path) if (text is None and pdf_path) else ""

    return {"cv": cv, "applied": applied, "failed": failed, "photo": photo}


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", default=None)
    parser.add_argument("--text-file", default=None)
    parser.add_argument("--changes", required=True)
    args = parser.parse_args()

    if not args.pdf and not args.text_file:
        parser.error("cần --pdf hoặc --text-file")

    try:
        text = None
        if args.text_file:
            with open(args.text_file, "r", encoding="utf-8") as handle:
                text = handle.read()
        with open(args.changes, "r", encoding="utf-8") as handle:
            changes = json.load(handle)
        with contextlib.redirect_stdout(sys.stderr):
            result = build_draft(args.pdf, changes, text=text)
        payload, code = {"success": True, **result}, 0
    except ValueError as error:
        payload, code = {"success": False, "error": str(error)}, 2
    except Exception as error:  # noqa: BLE001
        import traceback

        traceback.print_exc(file=sys.stderr)
        payload, code = {"success": False, "error": f"Lỗi dựng bản nháp: {error}"}, 1

    sys.stdout.write(json.dumps(payload, ensure_ascii=False, default=str) + "\n")
    sys.exit(code)


if __name__ == "__main__":
    main()
