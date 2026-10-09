import re
import unicodedata


def normalize_text(text):
    """
    Chuẩn hóa text tổng quát.
    """
    if not text:
        return ""
    
    # Chuẩn hóa xuống dòng
    text = text.replace("\r\n", "\n")
    text = text.replace("\r", "\n")

    # FIX: PDF tiếng Việt thường trả chữ có dấu ở dạng NFD (ký tự + dấu
    # rời), làm mọi phép so khớp với từ khóa NFC bị hỏng.
    text = unicodedata.normalize("NFC", text)

    # Chuẩn hóa khoảng trắng
    lines = text.split("\n")

    normalized_lines = []

    for line in lines:

        line = line.strip()

        if not line:
            continue

        # Nhiều khoảng trắng -> một khoảng trắng
        line = re.sub(r"[ \t]+", " ", line)

        normalized_lines.append(line)

    return "\n".join(normalized_lines)

def normalize_skills(text):
    """
    Chuẩn hóa section Skills.
    """
    if not text:
        return ""

    text = normalize_text(text)

    lines = text.split("\n")

    result = []

    for line in lines:

        # Chuẩn hóa dấu phẩy
        line = re.sub(r"\s*,\s*", ", ", line)

        # Chuẩn hóa dấu /
        # FIX: chỉ chuẩn hóa khi "/" đã có khoảng trắng; trước đây
        # "CI/CD" -> "CI / CD", "TCP/IP" -> "TCP / IP", URL bị phá.
        line = re.sub(r"\s+/\s+", " / ", line)

        result.append(line)

    return "\n".join(result)

def normalize_bullets(text):
    """
    Chuẩn hóa các ký hiệu bullet.
    """
    if not text:
        return ""
    
    lines = text.split("\n")

    result = []

    for line in lines:

        line = line.strip()

        if not line:
            continue

        # Các bullet thường gặp
        # \uf0b7/\uf0a7: bullet dạng private-use do Word/PDF xuất ra.
        line = re.sub(r"^[•▪●◦○■□◆◇➢➤►‣\uf0b7\uf0a7\uf076]\s*", "- ", line)

        result.append(line)

    return "\n".join(result)

def normalize_section(text, section_name):
    """
    Chuẩn hóa nội dung của từng section.
    """

    if not text:
        return ""

    text = normalize_text(text)

    if section_name == "skills":
        text = normalize_skills(text)

    text = normalize_bullets(text)

    return text

def normalize_cv_text(text):
    """
    Hàm chuẩn hóa chính cho toàn bộ CV.

    Raw Text
        ↓
    normalize_text
        ↓
    normalize_bullets
        ↓
    Normalized Text
    """

    if not text:
        return ""

    text = normalize_text(text)

    text = normalize_bullets(text)

    return text