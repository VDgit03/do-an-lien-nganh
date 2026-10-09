import pymupdf


def extract_text_from_pdf(pdf_path):
    """
    Đọc toàn bộ nội dung text từ file PDF.
    """

    document = pymupdf.open(pdf_path)

    text = ""

    for page in document:
        text += page.get_text()

    document.close()

    return text
