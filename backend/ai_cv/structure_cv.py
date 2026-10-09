import re

# 1. CẤU TRÚC CV
def create_empty_cv():
    """
    Tạo cấu trúc CV chuẩn.
    """

    return {
        "personal": {
            "name": "",
            "title": "",
            "email": "",
            "phone": "",
            "address": "",
            "linkedin": "",
            "github": ""
        },

        "summary": "",

        "education": [],

        "experience": [],

        "skills": [],

        "projects": [],

        "certifications": [],

        "awards": [],

        "languages": [],

        "other": []
    }

# 2. SECTION ALIASES
SECTION_ALIASES = {

    "personal": [
        "personal",
        "personal information",
        "contact",
        "contact information",
        "thông tin cá nhân"
    ],

    "summary": [
        "summary",
        "professional summary",
        "profile",
        "professional profile",
        "about me",
        "career objective",
        "objective",
        "career summary",
        "personal statement",
        "giới thiệu",
        "mục tiêu nghề nghiệp"
    ],

    "education": [
        "education",
        "academic background",
        "academic history",
        "educational background",
        "academic",
        "học vấn",
        "trình độ học vấn"
    ],

    "experience": [
        "experience",
        "work experience",
        "professional experience",
        "employment",
        "employment history",
        "work history",
        "career history",
        "kinh nghiệm",
        "kinh nghiệm làm việc"
    ],

    "skills": [
        "skill",
        "skills",
        "technical skills",
        "technical skill",
        "core skills",
        "skills & abilities",
        "skills and abilities",
        "professional skills",
        "technical expertise",
        "competencies",
        "kỹ năng",
        "kỹ năng chuyên môn"
    ],

    "projects": [
        "project",
        "projects",
        "personal project",
        "personal projects",
        "academic project",
        "academic projects",
        "project experience",
        "selected projects",
        "key projects",
        "dự án",
        "dự án cá nhân"
    ],

    "certifications": [
        "certification",
        "certifications",
        "certificate",
        "certificates",
        "professional certifications",
        "licenses",
        "licenses & certifications",
        "chứng chỉ",
        "chứng nhận"
    ],

    "awards": [
        "award",
        "awards",
        "honor",
        "honors",
        "achievement",
        "achievements",
        "accomplishments",
        "giải thưởng",
        "thành tích"
    ],

    "languages": [
        "language",
        "languages",
        "language skills",
        "ngôn ngữ"
    ],

    "other": [
        "activity",
        "activities",
        "extracurricular",
        "extracurricular activities",

        "interest",
        "interests",

        "hobby",
        "hobbies",
        "hobbies and interests",

        "volunteer",
        "volunteering",
        "volunteer experience",
        "volunteer activities",

        "leadership",
        "leadership experience",

        "professional development",
        "development",

        "courses",
        "coursework",
        "training",
        "trainings",

        "publications",
        "publication",

        "references",
        "reference",

        "memberships",
        "membership",
        "professional memberships",

        "conferences",
        "conference",

        "additional information",
        "additional details",
        "more information",
        "other information",

        "extracurricular activities",

        "social activities",
        "organizations",
        "organization",
    ]
}

# 3. CÁC PATTERN CHUNG

# BUG CŨ: pattern chỉ nhận numeric "MM/YYYY" hoặc "YYYY" nên các mốc thời
# gian viết dạng tên tháng (vd: "Jan 2020", "January 2020") không được nhận
# diện là date -> is_date_range()/is_single_date() luôn trả về False cho
# rất nhiều CV thực tế, khiến experience/education/projects không tách được
# ngày tháng. Bổ sung MONTH_TOKEN để hỗ trợ cả hai định dạng.
MONTH_TOKEN = (
    r"(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|"
    r"jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|"
    r"dec(?:ember)?)\.?\s+(?:19|20)\d{2}"
)

DATE_TOKEN = (
    r"(?:"
    r"(?:0?[1-9]|1[0-2])\s*[/.-]\s*(?:19|20)\d{2}"
    r"|"
    + MONTH_TOKEN +
    r"|"
    r"(?:19|20)\d{2}"
    r")"
)

DATE_RANGE_PATTERN = re.compile(
    r"""
    ^
    \s*
    """ + DATE_TOKEN + r"""
    \s*
    [-–—]
    \s*
    (?:
    """ + DATE_TOKEN + r"""
        |
        now
        |
        present
        |
        current
    )
    \s*
    $
    """,
    re.IGNORECASE | re.VERBOSE
)


SINGLE_DATE_PATTERN = re.compile(
    r"""
    ^
    \s*
    """ + DATE_TOKEN + r"""
    \s*
    $
    """,
    re.IGNORECASE | re.VERBOSE
)


EMAIL_PATTERN = re.compile(
    r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"
)


PHONE_PATTERN = re.compile(
    r"""
    (?<!\d)
    (?:
        \+?\d[\d\s().-]{7,}\d
    )
    (?!\d)
    """,
    re.VERBOSE
)


URL_PATTERN = re.compile(
    r"https?://[^\s<>\"]+",
    re.IGNORECASE
)

# 4. NORMALIZE HEADING
def normalize_heading(text):
    """
    Chuẩn hóa heading để so sánh.
    """

    if not text:
        return ""

    text = text.replace("\ufeff", "")
    text = text.replace("\u200b", "")
    text = text.replace("\u00a0", " ")

    text = text.strip()

    # Bỏ bullet ở đầu
    text = re.sub(
        r"^[•▪●◦○■□◆◇\-–—]+\s*",
        "",
        text
    )

    # Chuẩn hóa khoảng trắng
    text = re.sub(
        r"\s+",
        " ",
        text
    )

    # Bỏ dấu : ở cuối heading
    text = re.sub(
        r"\s*[:：]\s*$",
        "",
        text
    )

    return text.lower().strip()

# 5. DETECT SECTION BẰNG ALIAS
def detect_section_by_alias(line):
    """
    Tìm section dựa trên danh sách alias.
    """

    normalized = normalize_heading(line)

    if not normalized:
        return None

    for section_name, aliases in SECTION_ALIASES.items():
        for alias in aliases:
            if normalized == normalize_heading(alias):
                return section_name

    # FIX: heading biến thể/gộp viết HOA ("FEATURED PROJECTS",
    # "EDUCATION & CERTIFICATIONS") trước đây rơi vào "other" -> mất hẳn
    # mục Projects/Education. Chỉ áp dụng khi dòng trông như heading
    # (để "Project Management" trong danh sách kỹ năng không bị nhầm).
    if len(normalized.split()) <= 6 and looks_like_heading(line):
        fallback_rules = (
            ("education", r"\beducation\b|\bhọc vấn\b"),
            ("projects", r"\bprojects?$|\bdự án$"),
            ("experience",
             r"\b(?:experience|employment|work history)$"),
            ("skills", r"\bskills?$|\bexpertise$"),
            ("certifications", r"\bcertifications?$|\bcertificates?$"),
            ("awards", r"\b(?:awards?|honou?rs?|achievements?)$"),
        )
        for section_name, pattern in fallback_rules:
            if re.search(pattern, normalized):
                return section_name

    return None

# 6. DETECT HEADING THEO HÌNH THỨC
def looks_like_heading(line):
    if not line:
        return False

    line = line.strip()

    if len(line) > 70:
        return False

    # "Nhãn:giá trị" (vd "TOEIC:800+") là nội dung, không phải heading.
    if re.search(r"[:：]\s*\S", line):
        return False

    # Email / URL không phải heading
    if EMAIL_PATTERN.search(line):
        return False

    if URL_PATTERN.search(line):
        return False

    # Có nhiều dấu câu -> thường là câu mô tả
    punctuation_count = len(
        re.findall(r"[,.!?;]", line)
    )

    if punctuation_count >= 2:
        return False

    # Heading thường không kết thúc bằng dấu câu
    if line.endswith((".", ",", ";", ":")):
        return False

    words = line.split()

    if not words:
        return False

    # Heading rất dài thường không phải heading
    if len(words) > 8:
        return False

    # Tất cả uppercase
    letters = [
        char for char in line
        if char.isalpha()
    ]

    if letters:
        uppercase_ratio = sum(
            char.isupper()
            for char in letters
        ) / len(letters)

        if uppercase_ratio >= 0.8:
            return True

    return False

# 7. DETECT SECTION
def detect_section_heading(line):
    if not line:
        return None

    alias_section = detect_section_by_alias(line)

    if alias_section:
        return alias_section

    if looks_like_heading(line):
        return "other"

    return None

# 8. DETECT SECTIONS
def detect_sections(text):
    if not text:
        return {}

    lines = text.split("\n")

    sections = {}

    current_section = None
    current_other = None
    header_skipped = 0
    prev_line = ""

    for raw_line in lines:

        line = raw_line.strip()

        if not line:
            continue

        # FIX: dòng ngay sau dòng kết thúc bằng "," "/" "&" "(" là phần nối
        # của dòng PDF bị wrap (vd "Git,\nCI/CD"), không phải heading.
        continuation = bool(prev_line) and prev_line.rstrip().endswith(
            (",", "/", "&", "(")
        )
        detected_section = (
            None if continuation else detect_section_heading(line)
        )
        prev_line = line

        # FIX: tên/chức danh viết HOA ở đầu CV không phải một section.
        if (
            detected_section == "other"
            and current_section is None
            and header_skipped < 2
        ):
            header_skipped += 1
            continue

        # Gặp heading
        if detected_section:
            current_section = detected_section

            if detected_section == "other":

                if "other" not in sections:
                    sections["other"] = []
                current_other = {
                    "section": line,
                    "content": []
                }
                sections["other"].append(
                    current_other
                )
            else:
                current_other = None

                if detected_section not in sections:
                    sections[detected_section] = []

            continue
        # Chưa có section
        if current_section is None:
            continue

        # OTHER
        if current_section == "other":

            if current_other is not None:

                current_other["content"].append(
                    line
                )

        # CORE
        else:

            sections[current_section].append(
                line
            )

    # Convert core sections thành string
    for section_name in list(sections.keys()):

        if section_name == "other":
            continue

        sections[section_name] = "\n".join(
            sections[section_name]
        ).strip()

    # Convert other content list -> string
    if "other" in sections:

        cleaned_other = []

        for item in sections["other"]:

            content = "\n".join(
                item["content"]
            ).strip()

            cleaned_other.append({
                "section": item["section"].strip(),
                "content": content
            })

        sections["other"] = cleaned_other

    return sections

# 9. PERSONAL INFORMATION
def clean_url(url):
    """
    Làm sạch URL.
    """
    return url.rstrip(".,;:)]}>")


ADDRESS_LABELS = [
    "address",
    "location",
    "residence",
    "current address",
    "home address",
    "địa chỉ",
    "nơi ở",
]

PHONE_LABEL_PATTERN = re.compile(
    r"^\s*(?:phone|mobile|tel|telephone|điện thoại)\s*[:：-]?\s*(.*)$",
    re.IGNORECASE,
)


def extract_labeled_value_any(line, labels):
    """
    Lấy value từ dạng:
        Label: value
        Label - value
        Label
        value ở dòng kế tiếp sẽ được xử lý ở caller.
    """
    normalized_line = line.strip()

    for label in labels:
        match = re.match(
            rf"^\s*{re.escape(label)}\s*[:：-]\s*(.*?)\s*$",
            normalized_line,
            re.IGNORECASE,
        )
        if match:
            return match.group(1).strip()

    return ""


def looks_like_address(line):
    """
    Heuristic tổng quát để nhận diện địa chỉ khi CV không ghi label.
    Không phụ thuộc vào một thành phố/quốc gia cụ thể.
    """
    if not line:
        return False

    value = line.strip()

    if EMAIL_PATTERN.search(value) or URL_PATTERN.search(value):
        return False

    # Loại các dòng rõ ràng không phải địa chỉ.
    if detect_section_heading(value):
        return False

    address_words = re.search(
        r"\b("
        r"street|st\.?|road|rd\.?|avenue|ave\.?|"
        r"lane|ln\.?|drive|dr\.?|boulevard|blvd\.?|"
        r"district|city|province|ward|county|"
        r"đường|phố|quận|huyện|tỉnh|thành phố|"
        r"phường|xã|thôn|ấp|ngõ|ngách|"
        r"apartment|apt\.?|buildings|block|"
        r"residence|address"
        r")\b",
        value,
        re.IGNORECASE,
    )

    has_house_number = bool(
        re.search(r"^\s*\d+[A-Za-z]?(?:[/-]\d+)?\b", value)
    )

    # Có số nhà + thành phần địa chỉ, hoặc có từ khóa địa chỉ.
    return bool(address_words and (has_house_number or len(value.split()) >= 2))


def extract_personal_information(text):
    lines = [
        line.strip()
        for line in text.split("\n")
        if line.strip()
    ]

    personal = {
        "name": "",
        "title": "",
        "email": "",
        "phone": "",
        "address": "",
        "linkedin": "",
        "github": "",
    }

    if not lines:
        return personal

    # Name/title chỉ lấy từ phần header trước section đầu tiên.
    header_lines = []
    for line in lines:
        section = detect_section_heading(line)
        # FIX: tên viết HOA toàn bộ (rất phổ biến) bị looks_like_heading()
        # coi là heading "other" -> header rỗng -> name = "". Cho phép tối
        # đa 2 dòng đầu dạng này (tên, chức danh) làm header.
        if section and not (section == "other" and len(header_lines) < 2):
            break
        header_lines.append(line)

    # Name: dòng đầu tiên không phải contact.
    for line in header_lines:
        if (
            not EMAIL_PATTERN.search(line)
            and not URL_PATTERN.search(line)
            and not PHONE_LABEL_PATTERN.match(line)
            and not re.fullmatch(r"[\d\s()+./-]{8,}", line)
            and not extract_labeled_value_any(line, ADDRESS_LABELS)
            and not looks_like_address(line)
        ):
            personal["name"] = line
            break

    # Title: dòng hợp lý tiếp theo sau name, không phải contact/address.
    if personal["name"]:
        name_index = header_lines.index(personal["name"])
        for line in header_lines[name_index + 1:]:
            if re.search(
                r"github|linkedin|facebook|portfolio|website|behance",
                line,
                flags=re.IGNORECASE,
            ):
                continue

            if (
                EMAIL_PATTERN.search(line)
                or URL_PATTERN.search(line)
                or PHONE_LABEL_PATTERN.match(line)
                or re.fullmatch(r"[\d\s()+./-]{8,}", line)
                or extract_labeled_value_any(line, ADDRESS_LABELS)
                or looks_like_address(line)
            ):
                continue

            if line != personal["name"]:
                personal["title"] = line
                break

    # Email.
    email_match = EMAIL_PATTERN.search(text)
    if email_match:
        personal["email"] = email_match.group(0)

    # Phone: ưu tiên dòng có label, sau đó mới dùng heuristic.
    for line in lines:
        match = PHONE_LABEL_PATTERN.match(line)
        if match:
            candidate = match.group(1).strip()
            phone_match = PHONE_PATTERN.search(candidate) or PHONE_PATTERN.search(line)
            if phone_match:
                personal["phone"] = re.sub(r"\s+", " ", phone_match.group(0).strip())
                break

    if not personal["phone"]:
        for line in lines:
            if EMAIL_PATTERN.search(line):
                continue

            if URL_PATTERN.search(line):
                continue

            # FIX: các dòng ngày tháng (vd "01/2018 - 12/2022") có thể
            # chứa 9-15 chữ số liên tiếp và bị PHONE_PATTERN match nhầm
            # thành số điện thoại. Loại các dòng dạng date trước khi thử.
            if is_date_range(line) or is_single_date(line):
                continue

            phone_match = PHONE_PATTERN.search(line)
            if phone_match:
                candidate = phone_match.group(0).strip()
                digits = re.sub(r"\D", "", candidate)

                if 9 <= len(digits) <= 15:
                    personal["phone"] = re.sub(r"\s+", " ", candidate)
                    break

    # LinkedIn.
    # BUG CŨ: pattern bắt buộc phải có "http(s)://" ở đầu, trong khi rất
    # nhiều CV chỉ ghi "linkedin.com/in/..." không kèm scheme -> linkedin
    # luôn bị bỏ trống dù có ghi rõ trong CV. Scheme nay là optional.
    linkedin_pattern = re.compile(
        r"\b(?:https?://)?(?:www\.)?linkedin\.com/[^\s]+",
        re.IGNORECASE,
    )
    linkedin_match = linkedin_pattern.search(text)
    if linkedin_match:
        personal["linkedin"] = clean_url(linkedin_match.group(0))

    # GitHub profile, không lấy repository.
    # (Cùng lý do như LinkedIn ở trên, scheme cũng được coi là optional.)
    github_pattern = re.compile(
        r"\b(?:https?://)?(?:www\.)?github\.com/"
        r"([A-Za-z0-9_.-]+)"
        r"(?:/([A-Za-z0-9_.-]+))?"
        r"(?:[/?#][^\s]*)?",
        re.IGNORECASE,
    )

    for match in github_pattern.finditer(text):
        username = match.group(1)
        second_path = match.group(2)

        if second_path:
            continue

        personal["github"] = clean_url(match.group(0))
        break

    # Address:
    # 1) label cùng dòng: Address: ...
    # 2) label một dòng, value ở dòng kế tiếp.
    # 3) heuristic nếu không có label.
    for i, line in enumerate(lines):
        value = extract_labeled_value_any(line, ADDRESS_LABELS)

        if value:
            personal["address"] = value
            break

        if normalize_heading(line) in {
            normalize_heading(label) for label in ADDRESS_LABELS
        }:
            if i + 1 < len(lines):
                candidate = lines[i + 1]
                if (
                    not EMAIL_PATTERN.search(candidate)
                    and not URL_PATTERN.search(candidate)
                    and not detect_section_heading(candidate)
                ):
                    personal["address"] = candidate
                    break

    if not personal["address"]:
        for line in lines:
            if looks_like_address(line):
                personal["address"] = line
                break

    return personal


# 10. SUMMARY

def extract_summary(sections, text):

    if "summary" in sections:

        return sections["summary"].strip()

    lines = [
        line.strip()
        for line in text.split("\n")
        if line.strip()
    ]

    if len(lines) <= 2:
        return ""

    summary_lines = []

    # Các section heading đầu tiên đánh dấu kết thúc header
    for index, line in enumerate(lines[2:], start=2):

        if detect_section_heading(line):

            break

        if EMAIL_PATTERN.search(line):
            continue

        if URL_PATTERN.search(line):
            continue

        if re.fullmatch(
            r"[\d\s()+.-]{8,}",
            line
        ):
            continue

        summary_lines.append(line)

    return " ".join(summary_lines).strip()

# 11. DATE HELPERS
def is_date_range(line):
    return bool(
        DATE_RANGE_PATTERN.match(
            line.strip()
        )
    )

def is_single_date(line):
    return bool(
        SINGLE_DATE_PATTERN.match(
            line.strip()
        )
    )

# 12. EDUCATION
_DEGREE_WORDS = re.compile(
    r"\b(?:bachelor|b\.?\s?s\.?c?|master|m\.?\s?s\.?c?|ph\.?d|engineer|"
    r"degree|diploma|associate|cử nhân|kỹ sư|thạc sĩ|tiến sĩ|cao đẳng)\b",
    re.IGNORECASE,
)

_CREDENTIAL_LINE = re.compile(
    r"^(?:credentials?|certifications?|certificates?|licenses?|"
    r"languages?|chứng chỉ|ngoại ngữ)(?:\s*(?:&|and)\s*\w+)?\s*[:：]\s*(.+)$",
    re.IGNORECASE,
)

_SPOKEN_LANGUAGE = re.compile(
    r"\b(?:english|japanese|korean|chinese|french|german|spanish|"
    r"vietnamese|ielts|toeic|toefl|jlpt|topik|hsk|delf|cefr|tiếng)\b",
    re.IGNORECASE,
)


def split_credentials(text):
    """
    Tách dòng "Credentials & Languages: IELTS 8.0 • JLPT N3" khỏi mục
    Education (heading gộp "Education & Certifications").
    Trả (education_text, certifications, languages).
    """
    kept, certs, langs = [], [], []

    for line in (text or "").split("\n"):
        match = _CREDENTIAL_LINE.match(line.strip())

        if not match:
            kept.append(line)
            continue

        for item in re.split(r"[•·;|]", match.group(1)):
            item = item.strip(" -–—\t")
            if not item:
                continue
            (langs if _SPOKEN_LANGUAGE.search(item) else certs).append(item)

    return "\n".join(kept), certs, langs


def _split_institution_degree(line):
    """"HUST – B.S. in IT" -> ("HUST", "B.S. in IT") nếu vế phải là bằng cấp."""
    parts = re.split(r"\s+[–—|-]\s+", line, maxsplit=1)

    if (
        len(parts) == 2
        and parts[0].strip()
        and _DEGREE_WORDS.search(parts[1])
    ):
        return parts[0].strip(), parts[1].strip()

    return line, ""


def _is_sentence(line):
    """Câu mô tả dài, không phải tên bằng cấp."""
    return len(line.split()) > 12 or line.rstrip().endswith(".")


def extract_education(text):
    if not text:
        return []

    lines = [
        line.strip()
        for line in text.split("\n")
        if line.strip()
    ]

    if not lines:
        return []

    education_list = []

    current = None

    for line in lines:

        if is_date_range(line) or is_single_date(line):

            if current is None:

                current = {
                    "institution": "",
                    "degree": "",
                    "major": "",
                    "date": line,
                    "gpa": "",
                    "description": []
                }

                education_list.append(current)

            else:

                current["date"] = line

            continue

        # GPA
        gpa_match = re.search(
            r"\b(?:gpa|cgpa)\s*[:\-]?\s*"
            r"(\d+(?:[.,]\d+)?(?:\s*/\s*\d+)?)",
            line,
            re.IGNORECASE
        )

        if gpa_match:

            if current is None:

                current = {
                    "institution": "",
                    "degree": "",
                    "major": "",
                    "date": "",
                    "gpa": "",
                    "description": []
                }

                education_list.append(current)

            current["gpa"] = gpa_match.group(1)

            continue

        # Major
        major_match = re.match(
            r"^(?:major|field of study|specialization)"
            r"\s*(?:in|:|-)?\s*(.+)$",
            line,
            re.IGNORECASE
        )

        if major_match:

            if current is None:
                current = {
                    "institution": "",
                    "degree": "",
                    "major": "",
                    "date": "",
                    "gpa": "",
                    "description": []
                }
                education_list.append(current)
            current["major"] = major_match.group(1).strip()

            continue

        # Nếu chưa có entry
        if current is None:

            institution, degree = _split_institution_degree(line)

            current = {
                "institution": institution,
                "degree": degree,
                "major": "",
                "date": "",
                "gpa": "",
                "description": []
            }

            education_list.append(current)

            continue

        if not current["institution"]:

            current["institution"] = line

            continue

        # Degree (câu mô tả dài/kết thúc bằng dấu chấm -> description)
        if not current["degree"] and not _is_sentence(line):

            current["degree"] = line

            continue

        # Description
        current["description"].append(line)

    return education_list

# 12.5 EXPERIENCE
def extract_experience(text):
    """
    Parse work experience section thành các entry có cấu trúc.

    Mỗi entry gồm:
        - date: chuỗi ngày, ví dụ "01/2020 - 12/2022" hoặc "2023 - Present"
        - position: chức danh
        - company: tên công ty
        - description: danh sách bullet mô tả công việc

    BUG CŨ:
        Trước đây experience chỉ được giữ nguyên dạng list các dòng raw
        (clean_bullet cho từng dòng), không tách được date/position/company.
        Vì vậy các bước sau (nlp_processor.py, candidate_profile.py) không
        thể tìm thấy start_date/end_date -> total_experience_years luôn = 0.
    """
    if not text:
        return []

    lines = [
        line.strip()
        for line in text.split("\n")
        if line.strip()
    ]

    if not lines:
        return []

    experience_list = []
    current = None
    description_lines = []
    header_slots_filled = 0

    def finalize_entry():
        nonlocal current, description_lines
        if current is None:
            return
        current["description"] = merge_project_description(
            description_lines
        )

        # FIX: "Intern Backend Developer - ABC Company" nằm cùng một dòng
        # -> tách position / company khi company còn trống.
        if current["position"] and not current["company"]:
            parts = re.split(
                r"\s+(?:-|–|—|\||@|at)\s+",
                current["position"],
                maxsplit=1,
                flags=re.IGNORECASE,
            )
            if len(parts) == 2 and parts[0].strip() and parts[1].strip():
                current["position"] = parts[0].strip()
                current["company"] = parts[1].strip()

        # FIX: layout "Công ty / Ngày / Chức danh" -> position và company
        # bị đảo. Nếu "company" giống chức danh còn "position" thì không,
        # đảo lại.
        if (
            current["position"]
            and current["company"]
            and looks_like_role(current["company"])
            and not looks_like_role(current["position"])
        ):
            current["position"], current["company"] = (
                current["company"],
                current["position"],
            )

        experience_list.append(current)
        current = None
        description_lines = []

    def start_entry(date_value):
        nonlocal current, header_slots_filled
        current = {
            "date": date_value,
            "position": "",
            "company": "",
            "description": [],
        }
        header_slots_filled = 0

    bullet_re = r"^[•▪●◦○■□◆◇\-–—*]"

    def _is_date_line(value):
        return is_date_range(value) or is_single_date(value)

    for idx, line in enumerate(lines):

        if _is_date_line(line):

            # FIX: layout "Chức danh / Công ty / Ngày" (ngày đứng SAU header)
            # trước đây bị tách thành 2 entry, entry có ngày không có chức
            # danh -> tổng số năm kinh nghiệm luôn = 0.
            if (
                current is not None
                and not description_lines
                and not current["date"]
            ):
                current["date"] = line
                continue

            if current is not None and not description_lines and header_slots_filled == 0:
                # Dòng date thứ 2 liền kề (vd: ngày bắt đầu và ngày kết thúc
                # bị tách dòng) -> cập nhật lại entry hiện tại thay vì tạo mới.
                current["date"] = line
                continue

            finalize_entry()
            start_entry(line)
            continue

        if detect_section_heading(line):
            finalize_entry()
            break

        is_bullet = bool(re.match(bullet_re, line))

        # FIX: entry đã có mô tả + dòng không-bullet mà 1-2 dòng sau là ngày
        # => đây là header của entry MỚI (layout header-trước-ngày).
        if (
            current is not None
            and description_lines
            and not is_bullet
            and (
                (idx + 1 < len(lines) and _is_date_line(lines[idx + 1]))
                or (
                    idx + 2 < len(lines)
                    and not re.match(bullet_re, lines[idx + 1])
                    and _is_date_line(lines[idx + 2])
                )
            )
        ):
            finalize_entry()
            start_entry("")
            current["position"] = line
            header_slots_filled = 1
            continue

        if current is None:
            start_entry("")

        if (
            not is_bullet
            and not description_lines
            and header_slots_filled < 2
        ):
            if header_slots_filled == 0:
                current["position"] = line
            else:
                current["company"] = line

            header_slots_filled += 1
            continue

        description_lines.append(line)

    finalize_entry()

    return experience_list

# 13. SPLIT COMMA AN TOÀN

def split_comma_outside_brackets(text):

    if not text:
        return []

    result = []
    current = []

    bracket_stack = []

    opening = {
        "(": ")",
        "[": "]",
        "{": "}"
    }

    closing = {
        ")",
        "]",
        "}"
    }

    for char in text:

        if char in opening:

            bracket_stack.append(
                opening[char]
            )

            current.append(char)

        elif char in closing:

            if bracket_stack:
                bracket_stack.pop()

            current.append(char)

        elif char == "," and not bracket_stack:

            value = "".join(current).strip()

            if value:
                result.append(value)

            current = []

        else:

            current.append(char)

    value = "".join(current).strip()

    if value:
        result.append(value)

    return result

# 14. CLEAN BULLET

def clean_bullet(text):
    return re.sub(
        r"^[•▪●◦○■□◆◇\-–—]+\s*",
        "",
        text.strip()
    ).strip()

# 15. SKILLS
SKILL_CATEGORY_PATTERN = re.compile(
    r"""
    ^
    (?:
        backend|frontend|database|databases|tools?|technologies?|
        programming|programming\s+languages?|frameworks?|libraries|
        platforms?|software|soft\s+skills?|technical\s+skills?|
        languages?|others?|ides?|methodolog(?:y|ies)|devops|deployment|
        ai(?:\s*/\s*ml)?|security|testing|infrastructure|cloud|
        ngôn\s+ngữ(?:\s+lập\s+trình)?|công\s+cụ|
        kỹ\s+năng(?:\s+mềm|\s+chuyên\s+môn)?
    )
    (?:
        \s+(?:development|technologies|skills|tools)
        |
        \s*&\s*[a-z]+(?:\s+[a-z]+)?
    )?
    $
    """,
    re.IGNORECASE | re.VERBOSE,
)

# FIX: dùng để strip phần nhãn category khi nó nằm CÙNG dòng với
# giá trị, vd "Tools: Git, Docker, VSCode" -> "Git, Docker, VSCode".
# Trước đây SKILL_CATEGORY_PATTERN chỉ match khi cả dòng là category
# đứng riêng, nên dạng "Label: values" bị lọt và nhãn dính vào skill
# đầu tiên.
SKILL_CATEGORY_PREFIX_PATTERN = re.compile(
    r"""
    ^
    (?:
        backend|frontend|database|databases|tools?|technologies?|
        programming\s+languages?|frameworks?|libraries|platforms?|
        software|soft\s+skills?|technical\s+skills?|
        languages?|others?|ides?|methodolog(?:y|ies)|
        ngôn\s+ngữ(?:\s+lập\s+trình)?|công\s+cụ|
        kỹ\s+năng(?:\s+mềm|\s+chuyên\s+môn)?
    )
    (?:\s+(?:development|technologies|skills|tools))?
    \s*[:：]\s*
    """,
    re.IGNORECASE | re.VERBOSE,
)


def is_skill_category(line):
    normalized = normalize_heading(line)
    return bool(SKILL_CATEGORY_PATTERN.match(normalized))


def strip_skill_category_prefix(line):
    """
    Bỏ phần "Category:" ở đầu dòng skill, giữ lại phần giá trị.
    """
    return SKILL_CATEGORY_PREFIX_PATTERN.sub("", line, count=1)


def merge_skill_lines(lines):
    """
    Ghép các dòng skill bị PDF wrap.

    Ví dụ:
        JavaScript
        (ES6+), Bootstrap
    ->
        JavaScript (ES6+), Bootstrap

    Chỉ ghép khi dòng sau rõ ràng là phần tiếp nối, tránh ghép
    tùy tiện các skill độc lập.
    """
    merged = []
    i = 0

    while i < len(lines):
        current = lines[i].strip()

        if not current:
            i += 1
            continue

        if i + 1 < len(lines):
            nxt = lines[i + 1].strip()

            # Dòng mới bắt đầu bằng dấu ngoặc thường là continuation.
            if nxt.startswith(("(", "[", "{")):
                current += " " + nxt
                i += 1

            # Dòng bắt đầu bằng continuation punctuation.
            elif (
                current
                and not current.endswith((",", ";", "/"))
                and nxt.startswith(("+", "#", ".", ")"))
            ):
                current += nxt
                i += 1

        merged.append(current)
        i += 1

    return merged


_SKILL_LABEL_WORDS = re.compile(
    r"\b(?:skills?|languages?|frameworks?|libraries|tools?|technologies|"
    r"platforms?|databases?|backend|frontend|devops|deployment|"
    r"programming|development|infrastructure|security|testing|cloud|"
    r"mobile|ai|ml|data|others?|methodolog\w*|software|kỹ năng|"
    r"ngôn ngữ|công cụ)\b",
    re.IGNORECASE,
)


def split_skill_label(line):
    """
    Tách "Nhãn: giá trị" trong mục Skills -> (nhãn, giá trị) hoặc None.

    Nhận cả nhãn lạ như "AI/ML:", "Deployment:", "Backend & Microservices:"
    nhưng KHÔNG nhầm "Java: 3 years" (nhãn là một kỹ năng) thành nhãn.
    """
    match = SKILL_CATEGORY_PREFIX_PATTERN.match(line)
    if match:
        return (
            line[:match.end()].rstrip(" :：").strip(),
            line[match.end():].strip(),
        )

    match = re.match(r"^([^:：]{2,40}?)\s*[:：]\s*(.*)$", line)
    if not match:
        return None

    label, value = match.group(1).strip(), match.group(2).strip()

    if re.search(r"\d|\(|\)|https?:|www\.", label):
        return None
    if len(label.split()) > 5:
        return None
    if "&" in label or _SKILL_LABEL_WORDS.search(label):
        return label, value

    return None


def extract_skill_groups(text):
    """Giữ nhóm kỹ năng đúng như CV khai báo: {nhóm: [kỹ năng]}."""
    if not text:
        return {}

    raw_lines = [
        line.strip()
        for line in text.split("\n")
        if line.strip()
    ]

    groups = {}
    current = None

    for line in merge_skill_lines(raw_lines):
        line = clean_bullet(line)

        if not line:
            continue

        if is_skill_category(line):
            current = re.sub(r"\s+", " ", line).strip(" :：")
            groups.setdefault(current, [])
            continue

        label_parts = split_skill_label(line)
        if label_parts:
            current = label_parts[0]
            groups.setdefault(current, [])
            line = label_parts[1]

        if not line or current is None:
            continue

        for part in split_comma_outside_brackets(line):
            part = part.strip()
            if part:
                groups[current].append(re.sub(r"\s+", " ", part))

    return {name: items for name, items in groups.items() if items}


def extract_skills(text):
    if not text:
        return []

    raw_lines = [
        line.strip()
        for line in text.split("\n")
        if line.strip()
    ]

    lines = merge_skill_lines(raw_lines)

    skills = []

    for line in lines:
        line = clean_bullet(line)

        if not line or is_skill_category(line):
            continue

        # FIX: bỏ nhãn category nếu nó đứng đầu dòng kèm giá trị,
        # vd "Tools: Git, Docker" -> "Git, Docker".
        label_parts = split_skill_label(line)
        if label_parts:
            line = label_parts[1]

        if not line:
            continue

        parts = split_comma_outside_brackets(line)

        for part in parts:
            part = part.strip()
            if part:
                skills.append(part)

    # Loại duplicate nhưng giữ thứ tự.
    result = []
    seen = set()

    for skill in skills:
        key = re.sub(r"\s+", " ", skill).strip().lower()

        if key in seen:
            continue

        seen.add(key)
        result.append(re.sub(r"\s+", " ", skill).strip())

    return result


# 16. PROJECT HELPERS

PROJECT_ROLE_KEYWORDS = [
    "developer",
    "engineer",
    "designer",
    "architect",
    "manager",
    "lead",
    "leader",
    "intern",
    "analyst",
    "consultant",
    "contributor"
]
def looks_like_role(line):
    normalized = line.lower()

    return any(
        re.search(
            rf"\b{re.escape(keyword)}\b",
            normalized
        )
        for keyword in PROJECT_ROLE_KEYWORDS
    )


def extract_url(line):
    match = URL_PATTERN.search(line)

    if not match:
        return ""

    return clean_url(
        match.group(0)
    )


def extract_labeled_value(line, labels):
    """
    Extract value sau label.

    Ví dụ:

        Repository: https://...
        Technologies: Java, Python
    """

    for label in labels:

        pattern = (
            rf"^\s*[•▪●◦○■□◆◇\-–—]?\s*"
            rf"{re.escape(label)}"
            rf"\s*[:：]\s*(.*?)\s*$"
        )

        match = re.match(
            pattern,
            line,
            re.IGNORECASE
        )

        if match:

            return match.group(1).strip()

    return ""


def has_labeled_key(line, labels):
    """
    Kiểm tra line có chứa label hay không, kể cả trường hợp value rỗng.
    Ví dụ:
        Repository:
        • Technologies: Java, Python
    """
    for label in labels:
        if re.match(
            rf"^\s*[•▪●◦○■□◆◇\-–—]?\s*"
            rf"{re.escape(label)}\s*[:：]",
            line.strip(),
            re.IGNORECASE,
        ):
            return True
    return False


def normalize_project_name(parts):
    """
    Ghép các dòng project name bị wrap.
    """

    if not parts:
        return ""

    return " ".join(
        part.strip()
        for part in parts
        if part.strip()
    )

# 17. PROJECTS
def merge_project_description(lines):
    """
    Gộp các dòng continuation của cùng một bullet.

    PDF thường biến:
        • Built an application for
          managing employees and users.
    thành 2 dòng. Hàm này trả lại 1 bullet hoàn chỉnh.
    """
    result = []
    current = ""

    for line in lines:
        cleaned = line.strip()

        if not cleaned:
            continue

        is_bullet = bool(
            re.match(r"^[•▪●◦○■□◆◇\-–—]\s*", cleaned)
        )

        cleaned = clean_bullet(cleaned)

        if is_bullet:
            if current:
                result.append(current.strip())
            current = cleaned
        else:
            # Nếu chưa có bullet, coi đây là nội dung đầu tiên.
            if not current:
                current = cleaned
            else:
                current += " " + cleaned

    if current:
        result.append(current.strip())

    return result


def is_repository_identifier(line):
    """
    Nhận diện tên repo dạng identifier mà không hard-code tên cụ thể.
    """
    value = line.strip()

    if not value or " " in value:
        return False

    if re.fullmatch(
        r"[A-Za-z0-9_.-]{3,}",
        value,
    ) and (
        "-" in value
        or "_" in value
        or "." in value
    ):
        return True

    return False


_BULLET_PREFIX = r"^([•▪●◦○■□◆◇\-–—*\s]*)"


def _canon_project_line(line):
    """Quy các nhãn đồng nghĩa về nhãn chuẩn parser đã hiểu."""
    line = re.sub(
        _BULLET_PREFIX + r"(?:technologies used|tech used|tools used|tech)"
        r"\s*[:：]",
        r"\1Technologies:", line, flags=re.IGNORECASE,
    )
    line = re.sub(
        _BULLET_PREFIX + r"(?:github|gitlab|source)\s*[:：]",
        r"\1Repository:", line, flags=re.IGNORECASE,
    )
    return line


_DEMO_LINE = re.compile(
    _BULLET_PREFIX + r"(?:live\s+)?(?:demo|website)\s*[:：]\s*(.+)$",
    re.IGNORECASE,
)

_PROJECT_BULLET = re.compile(r"^[•▪●◦○■□◆◇\-–—*]")
_PROJECT_LABELS = [
    "repository", "repo", "source code", "technologies", "technology",
    "tech stack", "stack", "built with",
]


def _is_structural_project_line(line):
    return bool(
        _PROJECT_BULLET.match(line)
        or extract_url(line)
        or extract_labeled_value(line, _PROJECT_LABELS)
        or has_labeled_key(line, _PROJECT_LABELS)
    )


def _looks_like_project_title(line):
    if not line or _PROJECT_BULLET.match(line):
        return False
    if (
        extract_url(line)
        or extract_labeled_value(line, _PROJECT_LABELS)
        or has_labeled_key(line, _PROJECT_LABELS)
    ):
        return False
    if line.endswith((".", ",", ";", ":")):
        return False
    if not (1 <= len(line.split()) <= 10):
        return False
    return line[0].isupper() or line[0].isdigit()


def extract_projects(text):
    if not text:
        return []

    lines = [
        line.strip()
        for line in text.split("\n")
        if line.strip()
    ]

    lines = [_canon_project_line(line) for line in lines]

    projects = []
    current = None
    description_lines = []
    repository_seen = False

    def finalize_project():
        nonlocal current, description_lines, repository_seen

        if current is None:
            return

        current["description"] = merge_project_description(
            description_lines
        )

        # FIX: "Tên dự án | Python, FastAPI, Docker" (kiểu CV LaTeX) -> tách
        # tên và công nghệ thay vì để cả cụm làm tên dự án.
        pipe = re.match(r"^(.*?)\s+[|｜]\s+(.+)$", current["name"] or "")
        if pipe and not current["technologies"]:
            current["name"] = pipe.group(1).strip()
            current["technologies"] = split_comma_outside_brackets(
                pipe.group(2)
            )

        # Loại duplicate technologies.
        unique_tech = []
        seen_tech = set()

        for tech in current["technologies"]:
            tech = tech.strip()
            if not tech:
                continue

            key = tech.lower()
            if key not in seen_tech:
                seen_tech.add(key)
                unique_tech.append(tech)

        current["technologies"] = unique_tech
        current.pop("_undated", None)

        projects.append(current)
        current = None
        description_lines = []
        repository_seen = False

    i = 0

    while i < len(lines):
        line = lines[i]

        # Date -> project mới.
        if is_date_range(line):
            finalize_project()

            current = {
                "date": line,
                "name": "",
                "role": "",
                "description": [],
                "technologies": [],
                "repository": "",
            }

            i += 1

            # Tên project có thể bị wrap trên nhiều dòng.
            name_parts = []

            while i < len(lines):
                candidate = lines[i]

                if is_date_range(candidate):
                    break

                if detect_section_heading(candidate):
                    break

                if looks_like_role(candidate):
                    break

                if extract_labeled_value(
                    candidate,
                    [
                        "repository",
                        "repo",
                        "source code",
                        "technologies",
                        "technology",
                        "tech stack",
                        "stack",
                        "built with",
                    ],
                ):
                    break

                if re.match(
                    r"^[•▪●◦○■□◆◇\-–—]",
                    candidate,
                ):
                    break

                name_parts.append(candidate)
                i += 1

                if i < len(lines) and looks_like_role(lines[i]):
                    break

            current["name"] = normalize_project_name(name_parts)
            continue

        # FIX: trước đây project KHÔNG có dòng ngày bị bỏ qua hoàn toàn
        # (current luôn None) -> cv["projects"] = []. Nay dòng tiêu đề đầu
        # tiên (không bullet/label/URL) mở một project mới.
        if current is None:
            if (
                not detect_section_heading(line)
                and not _PROJECT_BULLET.match(line)
                and not extract_url(line)
                and not extract_labeled_value(line, _PROJECT_LABELS)
                and not has_labeled_key(line, _PROJECT_LABELS)
            ):
                current = {
                    "date": "",
                    "name": line,
                    "role": "",
                    "description": [],
                    "technologies": [],
                    "repository": "",
                    "_undated": True,
                }
            i += 1
            continue

        # Project không ngày: dòng giống tiêu đề (ngắn, viết hoa chữ đầu,
        # không dấu câu cuối) ngay sau bullet/label/URL => project mới.
        if (
            current.get("_undated")
            and (
                description_lines
                or current["technologies"]
                or current["repository"]
            )
            and i > 0
            and _is_structural_project_line(lines[i - 1])
            and _looks_like_project_title(line)
        ):
            finalize_project()
            current = {
                "date": "",
                "name": line,
                "role": "",
                "description": [],
                "technologies": [],
                "repository": "",
                "_undated": True,
            }
            i += 1
            continue

        # Section mới.
        if detect_section_heading(line):
            finalize_project()
            break

        # Link demo: lưu riêng, không để thành bullet mô tả.
        demo_match = _DEMO_LINE.match(line)
        if demo_match:
            current["demo"] = demo_match.group(1).strip()
            i += 1
            continue

        # Repository label.
        repository_labels = [
            "repository",
            "repo",
            "source code",
        ]

        repository_value = extract_labeled_value(
            line,
            repository_labels,
        )

        if repository_value or has_labeled_key(line, repository_labels):
            if repository_value:
                url = extract_url(repository_value)

                if url:
                    current["repository"] = url
                else:
                    current["repository"] = repository_value

                repository_seen = True
                i += 1
                continue

            # Label đứng riêng, ví dụ "Repository:".
            # Lấy URL hoặc tên repo ở dòng kế tiếp.
            if i + 1 < len(lines):
                next_line = lines[i + 1]
                next_url = extract_url(next_line)

                if next_url:
                    current["repository"] = next_url
                    repository_seen = True
                    i += 2
                    continue

                if is_repository_identifier(next_line):
                    current["repository"] = next_line
                    repository_seen = True
                    i += 2
                    continue

            i += 1
            continue

        # URL đứng một mình.
        url = extract_url(line)
        if url:
            if "github.com" in url.lower() or "gitlab.com" in url.lower() or "bitbucket.org" in url.lower():
                current["repository"] = url
                repository_seen = True
                i += 1
                continue

        # Technologies.
        technology_value = extract_labeled_value(
            line,
            [
                "technologies",
                "technology",
                "tech stack",
                "stack",
                "built with",
            ],
        )

        if technology_value:
            current["technologies"].extend(
                split_comma_outside_brackets(
                    technology_value
                )
            )
            i += 1
            continue

        # Role.
        if (
            not current["role"]
            and looks_like_role(line)
        ):
            current["role"] = line
            i += 1
            continue

        # Nếu repo URL vừa xuất hiện và dòng kế tiếp là identifier
        # thì nhiều khả năng là tên repo được hiển thị riêng.
        if repository_seen and is_repository_identifier(line):
            i += 1
            repository_seen = False
            continue

        # Name fallback.
        if not current["name"]:
            if not line.startswith(
                ("-", "•", "▪", "●", "◦", "○")
            ):
                current["name"] = line
                i += 1
                continue

        # Dòng phụ đề ngắn ngay sau tên dự án không ngày (vd "Monorepo Web
        # Platform"): không phải bullet mô tả.
        if (
            current.get("_undated")
            and not description_lines
            and not current["role"]
            and not current.get("subtitle")
            and not _PROJECT_BULLET.match(line)
            and len(line.split()) <= 6
            and not line.rstrip().endswith((".", ":"))
        ):
            current["subtitle"] = line
            i += 1
            continue

        # Description giữ raw line; cuối hàm sẽ merge continuation.
        description_lines.append(line)
        i += 1

    finalize_project()

    return projects


# 18. GENERIC LIST SECTION
# ============================================================

def extract_generic_list(text):
    """
    Dùng cho certifications / awards / languages.

    Chưa cố gắng hiểu sâu semantic.
    Bước NLP sau này sẽ xử lý tốt hơn.
    """

    if not text:
        return []

    result = []

    for line in text.split("\n"):

        line = line.strip()

        if not line:
            continue

        line = clean_bullet(line)

        if line:
            result.append(line)

    return result


def extract_certifications(text):
    return extract_generic_list(text)


def extract_awards(text):
    return extract_generic_list(text)


def extract_languages(text):
    return extract_generic_list(text)


# ============================================================
# 19. BUILD STRUCTURED CV
# ============================================================

def build_structured_cv(text):
    """
    Pipeline chính:

        Normalized Text
                ↓
        detect_sections()
                ↓
        extract từng core section
                ↓
        Structured CV
    """

    cv = create_empty_cv()
    extra_certs, extra_langs = [], []

    if not text:
        return cv

    # --------------------------------------------------------
    # SECTION DETECTION
    # --------------------------------------------------------

    sections = detect_sections(text)

    # --------------------------------------------------------
    # PERSONAL
    # --------------------------------------------------------

    cv["personal"] = extract_personal_information(
        text
    )

    # --------------------------------------------------------
    # SUMMARY
    # --------------------------------------------------------

    cv["summary"] = extract_summary(
        sections,
        text
    )

    # --------------------------------------------------------
    # EDUCATION
    # --------------------------------------------------------

    if "education" in sections:

        education_text, extra_certs, extra_langs = split_credentials(
            sections["education"]
        )

        cv["education"] = extract_education(education_text)

    # --------------------------------------------------------
    # EXPERIENCE
    #
    # Hiện tại giữ raw structured lines.
    # Sau này có thể viết parser experience riêng.
    # --------------------------------------------------------

    if "experience" in sections:

        cv["experience"] = extract_experience(
            sections["experience"]
        )

    # --------------------------------------------------------
    # SKILLS
    # --------------------------------------------------------

    if "skills" in sections:

        cv["skills"] = extract_skills(
            sections["skills"]
        )

        cv["skill_groups"] = extract_skill_groups(
            sections["skills"]
        )

    # --------------------------------------------------------
    # PROJECTS
    # --------------------------------------------------------

    if "projects" in sections:

        cv["projects"] = extract_projects(
            sections["projects"]
        )

    # --------------------------------------------------------
    # CERTIFICATIONS
    # --------------------------------------------------------

    if "certifications" in sections:

        cv["certifications"] = extract_certifications(
            sections["certifications"]
        )

    # --------------------------------------------------------
    # AWARDS
    # --------------------------------------------------------

    if "awards" in sections:

        cv["awards"] = extract_awards(
            sections["awards"]
        )

    # --------------------------------------------------------
    # LANGUAGES
    # --------------------------------------------------------

    if "languages" in sections:

        cv["languages"] = extract_languages(
            sections["languages"]
        )

    # --------------------------------------------------------
    # OTHER
    #
    # Đây là phần quan trọng:
    #
    # Không tạo:
    #     activities
    #     hobbies
    #     interests
    #     volunteer
    #
    # Tất cả giữ trong:
    #
    #     cv["other"]
    #
    # Mỗi heading là một object riêng.
    # --------------------------------------------------------

    if "other" in sections:

        cv["other"] = []

        for item in sections["other"]:

            cv["other"].append({
                "section": item["section"],
                "content": item["content"]
            })

    # Chứng chỉ/ngoại ngữ tách từ mục Education gộp.
    for item in extra_certs:
        if item not in cv["certifications"]:
            cv["certifications"].append(item)

    for item in extra_langs:
        if item not in cv["languages"]:
            cv["languages"].append(item)

    return cv