"""
pdf_rebuild.py - Engine 2 (dự phòng): dựng lại CV thành PDF mới bằng reportlab.

Dùng structured_cv do pipeline AI_CV đã tách sẵn (structure_cv.py), thay các bullet bằng
bản đã viết lại rồi xuất bố cục sạch, một cột. Ổn định hơn sửa tại chỗ nhưng KHÔNG giữ
bố cục/màu sắc của CV gốc.
"""

import difflib
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer

from pdf_common import find_body_start, find_unicode_font, looks_personal, norm

ACCENT = colors.HexColor("#1f3a5f")


def _fonts():
    regular = find_unicode_font(False)
    if not regular:
        raise RuntimeError(
            "Không tìm thấy font Unicode (cần cho tiếng Việt). "
            "Đặt CV_FONT_PATH trong .env trỏ tới file .ttf (vd arial.ttf)."
        )
    bold = find_unicode_font(True) or regular
    pdfmetrics.registerFont(TTFont("CVFont", regular))
    pdfmetrics.registerFont(TTFont("CVFont-Bold", bold))
    pdfmetrics.registerFontFamily("CVFont", normal="CVFont", bold="CVFont-Bold",
                                  italic="CVFont", boldItalic="CVFont-Bold")


def _match(items, original):
    target = norm(original)
    for k, text in enumerate(items):
        if norm(text) == target:
            return k
    for k, text in enumerate(items):
        if difflib.SequenceMatcher(None, norm(text), target).ratio() >= 0.93:
            return k
    return None


def apply_changes_to_cv(cv, changes):
    """Thay bullet trong structured_cv. Trả về (applied, failed)."""
    lists = []
    for key in ("experience", "projects", "education"):
        for entry in cv.get(key) or []:
            if isinstance(entry.get("description"), list):
                lists.append(entry["description"])
    for block in cv.get("other") or []:
        if isinstance(block.get("content"), list):
            lists.append(block["content"])

    applied, failed = [], []
    for change in changes:
        done = False
        for items in lists:
            k = _match(items, change["original"])
            if k is not None:
                items[k:k + 1] = change["new"]
                applied.append({"id": change["id"], "verified": True})
                done = True
                break
        if not done:
            failed.append({"id": change["id"], "reason": "not_found"})
    return applied, failed


def _text(value):
    if isinstance(value, (list, tuple)):
        return ", ".join(str(v) for v in value if v)
    return str(value or "")


def render_cv(cv, out_path, header_lines=None):
    _fonts()
    base = ParagraphStyle("b", fontName="CVFont", fontSize=9.5, leading=13, alignment=TA_LEFT)
    small = ParagraphStyle("s", parent=base, fontSize=8.5, textColor=colors.HexColor("#555555"))
    name = ParagraphStyle("n", parent=base, fontName="CVFont-Bold", fontSize=20, leading=24, textColor=ACCENT)
    head = ParagraphStyle("h", parent=base, fontName="CVFont-Bold", fontSize=11, leading=14,
                          textColor=ACCENT, spaceBefore=8)
    bold = ParagraphStyle("t", parent=base, fontName="CVFont-Bold")
    bullet = ParagraphStyle("bl", parent=base, leftIndent=12, bulletIndent=2)

    story = []

    def section(title):
        story.append(Paragraph(escape(title.upper()), head))
        story.append(HRFlowable(width="100%", thickness=0.6, color=ACCENT, spaceAfter=3))

    def bullets(items):
        for item in items or []:
            if str(item).strip():
                story.append(Paragraph(escape(str(item)), bullet, bulletText="\u2022"))

    def entry_header(left, right=""):
        line = escape(left) + (("  <font color='#555555'>| %s</font>" % escape(right)) if right else "")
        story.append(Paragraph(line, bold))

    p = cv.get("personal") or {}
    if header_lines:
        # Giữ NGUYÊN VĂN phần đầu CV (tên, chức danh, liên hệ...) đúng như bản gốc
        for k, text in enumerate(header_lines):
            story.append(Paragraph(escape(text), name if k == 0 else (base if k == 1 else small)))
    else:
        if p.get("name"):
            story.append(Paragraph(escape(p["name"]), name))
        if p.get("title"):
            story.append(Paragraph(escape(p["title"]), base))
        contact = " | ".join(escape(p[k]) for k in ("email", "phone", "address", "linkedin", "github") if p.get(k))
        if contact:
            story.append(Paragraph(contact, small))

    if cv.get("summary"):
        section("Summary")
        story.append(Paragraph(escape(cv["summary"]), base))

    if cv.get("experience"):
        section("Experience")
        for e in cv["experience"]:
            entry_header(" - ".join(x for x in (e.get("position"), e.get("company")) if x), e.get("date", ""))
            bullets(e.get("description"))
            story.append(Spacer(1, 3))

    if cv.get("projects"):
        section("Projects")
        for pr in cv["projects"]:
            entry_header(pr.get("name", ""), " | ".join(x for x in (pr.get("role"), pr.get("date")) if x))
            if pr.get("technologies"):
                story.append(Paragraph("Technologies: " + escape(_text(pr["technologies"])), small))
            bullets(pr.get("description"))
            story.append(Spacer(1, 3))

    if cv.get("education"):
        section("Education")
        for ed in cv["education"]:
            title = " - ".join(x for x in (ed.get("institution"), ed.get("degree"), ed.get("major")) if x)
            entry_header(title, " | ".join(x for x in (ed.get("date"), ("GPA " + ed["gpa"]) if ed.get("gpa") else "") if x))
            bullets(ed.get("description"))

    if cv.get("skills"):
        section("Skills")
        story.append(Paragraph(escape(_text(cv["skills"])), base))

    for key, title in (("certifications", "Certifications"), ("awards", "Awards"), ("languages", "Languages")):
        values = cv.get(key) or []
        if values:
            section(title)
            for v in values:
                story.append(Paragraph(escape(_text(list(v.values()) if isinstance(v, dict) else v)),
                                       bullet, bulletText="\u2022"))

    for block in cv.get("other") or []:
        section(str(block.get("section", "Other")))
        content = block.get("content")
        if isinstance(content, list):
            bullets(content)
        elif content:
            story.append(Paragraph(escape(str(content)), base))

    SimpleDocTemplate(out_path, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm,
                      topMargin=15 * mm, bottomMargin=15 * mm,
                      title=(p.get("name") or "CV")).build(story)


def rebuild_pdf(pdf_path, changes, out_path, text=None):
    from normalizer import normalize_cv_text
    from structure_cv import build_structured_cv
    from pdf_common import extract_text

    raw = text if text is not None else extract_text(pdf_path)
    if not raw.strip():
        raise ValueError("PDF không có lớp chữ để dựng lại.")
    cv = build_structured_cv(normalize_cv_text(raw))

    # Phần đầu CV (trước About/Summary...) giữ nguyên văn, không qua bước tách/dựng lại
    raw_lines = [l.strip() for l in raw.replace("\r", "").split("\n")]
    start = find_body_start(raw_lines)
    header = [l for l in raw_lines[:start] if l] if start else None

    safe = [c for c in changes if not looks_personal(c["original"])]
    skipped = [{"id": c["id"], "reason": "personal_zone"} for c in changes if c not in safe]

    applied, failed = apply_changes_to_cv(cv, safe)
    failed += skipped
    if applied:
        render_cv(cv, out_path, header)
    return {"applied": applied, "failed": failed}
