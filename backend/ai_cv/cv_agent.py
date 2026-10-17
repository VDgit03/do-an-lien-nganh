"""
cv_agent.py - CV Agent: áp dụng các chỉnh sửa đã duyệt thẳng vào file PDF.

    python cv_agent.py --pdf cv.pdf --changes changes.json --out fixed.pdf [--mode auto]
    python cv_agent.py --text-file cv.txt --changes changes.json --out fixed.pdf   # CV dạng ảnh (đã OCR)

changes.json: [{"id": "0", "original": "...", "new": ["bản viết lại", "(bullet tách, nếu có)"]}]

Chế độ:
    inplace  chỉ sửa tại chỗ (giữ nguyên bố cục gốc)
    rebuild  chỉ dựng lại CV mới từ structured_cv
    auto     sửa tại chỗ trước; thay đổi nào không vừa/không tìm thấy thì thử dựng lại,
             và chỉ dùng bản dựng lại khi nó áp dụng được NHIỀU thay đổi hơn.

stdout: đúng MỘT dòng JSON (giống analyze_cv.py).
"""

import argparse
import contextlib
import json
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)


def _safe(fn, *args):
    """Chạy một engine, trả về (kết quả, lý do lỗi)."""
    try:
        return fn(*args), None
    except ImportError as error:
        return None, f"thiếu thư viện: {error}"
    except Exception as error:  # noqa: BLE001
        return None, str(error)


def run_agent(pdf_path, changes, out_path, mode="auto", text=None):
    """
    text: văn bản CV đã có sẵn (vd từ OCR khi PDF là ảnh). PDF ảnh không có toạ độ
    chữ nên không sửa tại chỗ được -> chỉ dùng chế độ dựng lại (rebuild).
    """
    def apply_inplace(*a):  # import muộn: thiếu pymupdf thì chỉ engine này tắt
        from pdf_inplace import apply_inplace as fn
        return fn(*a)

    def rebuild_pdf(*a):
        from pdf_rebuild import rebuild_pdf as fn
        return fn(*a)

    if text is not None:
        from analyze_cv import clean_ocr_text  # cùng bước làm sạch như lúc phân tích

        text = clean_ocr_text(text)
        mode = "rebuild"
    elif not pdf_path or not os.path.isfile(pdf_path):
        raise ValueError("Không tìm thấy file CV.")
    if not changes:
        raise ValueError("Không có thay đổi nào để áp dụng.")

    report = {"mode_used": None, "applied": [], "failed": [], "notes": []}
    tmp_inplace = out_path + ".inplace.pdf"
    tmp_rebuild = out_path + ".rebuild.pdf"

    inplace = None
    if mode in ("auto", "inplace"):
        inplace, err = _safe(apply_inplace, pdf_path, changes, tmp_inplace)
        if err:
            report["notes"].append(f"Sửa tại chỗ không chạy được: {err}")

    n_inplace = len(inplace["applied"]) if inplace else 0
    all_done = bool(inplace) and n_inplace == len(changes)

    rebuild = None
    if mode == "rebuild" or (mode == "auto" and not all_done):
        rebuild, err = _safe(rebuild_pdf, pdf_path, changes, tmp_rebuild, text)
        if err:
            report["notes"].append(f"Dựng lại CV không chạy được: {err}")

    n_rebuild = len(rebuild["applied"]) if rebuild else 0

    if rebuild and n_rebuild > n_inplace:
        chosen, used, src = rebuild, "rebuild", tmp_rebuild
        if mode == "auto":
            report["notes"].append(
                "Một số đoạn không sửa tại chỗ được nên đã dựng lại CV (bố cục có thể khác bản gốc)."
            )
    elif inplace and n_inplace:
        chosen, used, src = inplace, "inplace", tmp_inplace
    else:
        chosen, used, src = (inplace or rebuild or {"applied": [], "failed": []}), None, None

    if src:
        os.replace(src, out_path)
    for leftover in (tmp_inplace, tmp_rebuild):
        if os.path.exists(leftover):
            os.remove(leftover)

    if text is not None:
        report["notes"].append(
            "CV gốc là ảnh nên được dựng lại thành PDF có chữ (bố cục khác bản gốc, sửa được bằng Word/PDF editor)."
        )

    report["mode_used"] = used
    report["applied"] = chosen["applied"]
    report["failed"] = chosen["failed"]
    if any(not a.get("verified", True) for a in chosen["applied"]):
        report["notes"].append("Có đoạn chưa xác nhận được sau khi sửa, hãy xem lại PDF.")
    return report


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", default=None)
    parser.add_argument("--text-file", default=None)
    parser.add_argument("--changes", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--mode", default="auto", choices=["auto", "inplace", "rebuild"])
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
            report = run_agent(args.pdf, changes, args.out, args.mode, text=text)
        payload, code = {"success": True, **report}, 0
    except ValueError as error:
        payload, code = {"success": False, "error": str(error)}, 2
    except Exception as error:  # noqa: BLE001
        import traceback

        traceback.print_exc(file=sys.stderr)
        payload, code = {"success": False, "error": f"Lỗi CV Agent: {error}"}, 1

    sys.stdout.write(json.dumps(payload, ensure_ascii=False, default=str) + "\n")
    sys.exit(code)


if __name__ == "__main__":
    main()
