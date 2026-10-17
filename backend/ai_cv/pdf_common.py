"""Tiện ích dùng chung cho CV Agent (sửa PDF tại chỗ / dựng lại PDF)."""

import os
import re

PLACEHOLDER_RE = re.compile(r"\[[^\]\n]{1,40}\]")
BULLET_CHARS = "•●○▪■□◆◇◦·∙*-–—►▶➢"
BULLET_PREFIX_RE = re.compile(r"^[\s" + re.escape(BULLET_CHARS) + r"]+")


def norm(text):
    """Chuẩn hoá để so khớp: bỏ bullet đầu dòng, gộp khoảng trắng, hạ chữ thường."""
    text = BULLET_PREFIX_RE.sub("", str(text or ""))
    return re.sub(r"\s+", " ", text).strip().lower()


def has_placeholder(text):
    return bool(PLACEHOLDER_RE.search(str(text or "")))


_FONT_CANDIDATES = {
    False: [
        "CV_FONT_PATH",  # biến môi trường, ưu tiên cao nhất
        r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\tahoma.ttf",
        "/Library/Fonts/Arial Unicode.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
    ],
    True: [
        "CV_FONT_BOLD_PATH",
        r"C:\Windows\Fonts\arialbd.ttf",
        r"C:\Windows\Fonts\segoeuib.ttf",
        r"C:\Windows\Fonts\tahomabd.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf",
    ],
}


def find_unicode_font(bold=False):
    """Tìm font TTF có đủ glyph tiếng Việt. Trả về đường dẫn hoặc None."""
    for item in _FONT_CANDIDATES[bool(bold)]:
        path = os.environ.get(item) if item.isupper() else item
        if path and os.path.isfile(path):
            return path
    return None


def extract_text(pdf_path):
    """Đọc chữ từ PDF: ưu tiên PyMuPDF (như pipeline), dự phòng pdfplumber."""
    try:
        from read_cv import extract_text_from_pdf

        return extract_text_from_pdf(pdf_path)
    except ImportError:
        import pdfplumber

        with pdfplumber.open(pdf_path) as pdf:
            return "\n".join((p.extract_text() or "") for p in pdf.pages)


# Mục thật sự bắt đầu phần nội dung. Không tính "personal" và "other": tên viết HOA
# ở đầu CV hay bị nhận nhầm thành "other".
BODY_SECTIONS = {"summary", "education", "experience", "skills", "projects",
                 "certifications", "awards", "languages"}

_PERSONAL_RE = re.compile(
    r"@|https?://|www\.|linkedin|github|(?:\+?\d[\s.\-()]?){9,}", re.IGNORECASE
)


def find_body_start(lines):
    """Chỉ số dòng đầu tiên của phần nội dung (About/Summary/Experience...). None nếu không thấy."""
    from structure_cv import detect_section_heading

    for index, line in enumerate(lines):
        if detect_section_heading(str(line).strip()) in BODY_SECTIONS:
            return index
    return None


def looks_personal(text):
    """Có email / số điện thoại / link mạng xã hội -> thuộc thông tin cá nhân."""
    return bool(_PERSONAL_RE.search(str(text or "")))
