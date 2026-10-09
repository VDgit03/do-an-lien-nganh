"""
analyze_cv.py

Cầu nối giữa backend Node.js và pipeline AI_CV (thay cho main.py cũ,
vốn dùng input()/print() nên không gọi được từ web).

Cách dùng (Node gọi bằng child_process):

    python analyze_cv.py --pdf <cv.pdf> --level junior --role frontend
                         [--jd-file <jd.txt>]

Quy ước:
    - stdout: đúng MỘT dòng JSON (UTF-8). {"success": true, ...} hoặc
      {"success": false, "error": "..."}.
    - Mọi print() của các module bên trong bị chuyển sang stderr để không
      làm hỏng JSON.
    - Có --jd-file  -> so khớp CV với JD.
      Không có JD   -> so khớp với career framework theo role + level.
"""

import argparse
import contextlib
import json
import os
import sys

# Cho phép import các module cùng thư mục dù cwd là thư mục nào
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)


# Giá trị <option> ở frontend -> tên role trong CareerFramework
ROLE_MAP = {
    "frontend": "frontend developer",
    "backend": "backend developer",
    "mobile": "mobile developer",
    "ai-ml": "machine learning engineer",
    "data-scientist": "data scientist",
    "data-engineer": "data engineer",
    "devops": "devops engineer",
    "cloud": "cloud engineer",
    "cybersecurity": "cybersecurity engineer",
    "qa-qc": "qa engineer",
    "system-admin": "system administrator",
    "network": "network engineer",
    "ui-ux": "ui/ux designer",
    "ba": "business analyst",
    "dba": "database administrator",
}

# Frontend có "manager", framework chỉ có "lead"
LEVEL_MAP = {
    "intern": "intern",
    "fresher": "fresher",
    "junior": "junior",
    "middle": "middle",
    "senior": "senior",
    "manager": "lead",
    "lead": "lead",
}


class AnalysisError(Exception):
    """Lỗi nghiệp vụ có thông báo thân thiện để trả về người dùng."""


def run_analysis(pdf_path, jd_text, role, level):
    # Import muộn để lỗi thiếu thư viện (vd pymupdf) được báo rõ ràng
    try:
        from read_cv import extract_text_from_pdf
    except ImportError as error:
        raise AnalysisError(
            "Thiếu thư viện đọc PDF. Hãy chạy: "
            "pip install -r backend/ai_cv/requirements.txt "
            f"({error})"
        )

    from normalizer import normalize_cv_text
    from structure_cv import build_structured_cv
    from nlp_processor import CVNLPProcessor
    from candidate_profile import build_candidate_profile
    import career_framework
    import career_intelligence
    from jd_processor import JDProcessor
    from jd_profile import build_jd_profile
    from cv_advisor import advise_cv, format_report

    role_key = (role or "").strip().lower()
    framework_role = ROLE_MAP.get(role_key, role_key)

    level_key = (level or "").strip().lower()
    framework_level = LEVEL_MAP.get(level_key, level_key)

    # 1. Đọc CV
    if not os.path.isfile(pdf_path):
        raise AnalysisError("Không tìm thấy file CV.")

    try:
        raw_text = extract_text_from_pdf(pdf_path)
    except Exception as error:
        raise AnalysisError(f"Không đọc được file PDF: {error}")

    if not raw_text.strip():
        raise AnalysisError(
            "Không đọc được chữ từ PDF (có thể là bản scan/ảnh). "
            "Hãy dùng PDF có text hoặc chạy OCR trước."
        )

    # 2-5. Chuẩn hóa -> cấu trúc -> NLP -> Candidate Profile
    normalized_text = normalize_cv_text(raw_text)
    structured_cv = build_structured_cv(normalized_text)
    processed_cv = CVNLPProcessor().process_cv(structured_cv)
    candidate_profile = build_candidate_profile(
        structured_cv=structured_cv,
        processed_cv=processed_cv,
    )

    # 6. Yêu cầu: JD hoặc Career Framework
    if jd_text and jd_text.strip():
        mode = "jd"
        processed_jd = JDProcessor().process_jd(jd_text)
        requirements = build_jd_profile(processed_jd)

        # JD không ghi rõ level/title thì lấy theo lựa chọn của người dùng
        if not requirements.get("level") and framework_level:
            requirements["level"] = framework_level
        if not requirements.get("title") and framework_role:
            requirements["title"] = framework_role
    else:
        mode = "framework"
        requirements = career_framework.get_career_framework(
            role=framework_role,
            level=framework_level,
        )

        if requirements is None:
            raise AnalysisError(
                f"Chưa hỗ trợ ngành '{role}' trong khung năng lực."
            )

    # 7. Career Intelligence (raise ValueError nếu level/yêu cầu sai)
    try:
        result = career_intelligence.analyze(
            candidate_profile,
            requirements,
        )
    except ValueError as error:
        raise AnalysisError(f"Lỗi dữ liệu đầu vào: {error}")

    # 8. Gợi ý chỉnh sửa CV
    advice = advise_cv(candidate_profile, requirements, result)

    return {
        "success": True,
        "mode": mode,
        "input": {"role": framework_role, "level": framework_level},
        "result": result,
        "advice": advice,
        "report_text": format_report(advice),
    }


def main():
    # Windows mặc định không phải UTF-8
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", required=True)
    parser.add_argument("--jd-file", default=None)
    parser.add_argument("--role", default="")
    parser.add_argument("--level", default="")
    args = parser.parse_args()

    jd_text = ""
    if args.jd_file:
        with open(args.jd_file, "r", encoding="utf-8") as handle:
            jd_text = handle.read()

    try:
        # print() bên trong pipeline -> stderr, giữ stdout sạch cho JSON
        with contextlib.redirect_stdout(sys.stderr):
            payload = run_analysis(
                args.pdf, jd_text, args.role, args.level
            )
        exit_code = 0
    except AnalysisError as error:
        payload = {"success": False, "error": str(error)}
        exit_code = 2
    except Exception as error:  # lỗi không lường trước
        import traceback

        traceback.print_exc(file=sys.stderr)
        payload = {
            "success": False,
            "error": f"Lỗi khi phân tích CV: {error}",
        }
        exit_code = 1

    sys.stdout.write(json.dumps(payload, ensure_ascii=False, default=str))
    sys.stdout.write("\n")
    sys.stdout.flush()
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
