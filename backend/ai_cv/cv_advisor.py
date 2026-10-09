"""
cv_advisor.py

Sinh GỢI Ý CHỈNH SỬA CV dựa trên:
    1. Candidate Profile            (candidate_profile.py)
    2. Requirements (JD/Framework)  (jd_profile.py / career_framework.py)
    3. Kết quả phân tích            (career_intelligence.analyze)

Nguyên tắc:
    - KHÔNG bịa kinh nghiệm/số liệu. Kỹ năng chưa có chỉ được gợi ý
      "học + làm project rồi mới ghi vào CV"; kỹ năng đã có bằng chứng
      nhưng chưa được ghi rõ thì gợi ý "ghi rõ".
    - Mọi bản viết lại bullet chỉ là BẢN NHÁP có placeholder [..] để
      người dùng tự điền số liệu thật.
    - Chỉ đọc dữ liệu, không sửa Candidate Profile.

Cách dùng:
    from cv_advisor import advise_cv, format_report

    result = career_intelligence.analyze(candidate_profile, requirements)
    advice = advise_cv(candidate_profile, requirements, result)
    print(format_report(advice))
"""

import re
import unicodedata
from typing import Any, Dict, List, Optional, Tuple

from career_intelligence import CareerIntelligence

PRIORITY_ORDER = {"high": 0, "medium": 1, "low": 2}
EFFORT_ORDER = {"low": 0, "medium": 1, "high": 2}

# --------------------------------------------------------------------
# TỪ ĐIỂN
# --------------------------------------------------------------------

WEAK_PHRASES: Dict[str, str] = {
    # English
    "worked on": "Developed / Implemented",
    "worked with": "Collaborated with",
    "worked in": "Collaborated in",
    "responsible for": "Owned / Led",
    "in charge of": "Led / Managed",
    "tasked with": "Delivered",
    "duties included": "Delivered",
    "helped with": "Supported / Contributed to",
    "helped": "Supported / Contributed to",
    "participated in": "Contributed to",
    "involved in": "Contributed to",
    "assisted": "Supported",
    "handled": "Managed / Resolved",
    "did": "Delivered",
    "made": "Built",
    # Tiếng Việt
    "tham gia": "Triển khai / Đóng góp vào",
    "phụ trách": "Chịu trách nhiệm chính / Dẫn dắt",
    "làm việc với": "Phối hợp với",
    "hỗ trợ": "Đóng góp vào / Triển khai",
    "giúp": "Góp phần",
    "làm": "Xây dựng / Thực hiện",
}

STRONG_VERBS = {
    "built", "developed", "designed", "implemented", "created", "optimized",
    "optimised", "reduced", "improved", "increased", "led", "managed",
    "deployed", "automated", "migrated", "refactored", "integrated",
    "architected", "launched", "delivered", "analyzed", "analysed",
    "collaborated", "tested", "maintained", "resolved", "mentored",
    "configured", "established", "streamlined", "engineered", "researched",
    "wrote", "coordinated", "drove", "scaled", "secured", "monitored",
    "documented", "trained", "achieved", "debugged", "published",
    "xây", "phát", "thiết", "triển", "tối", "cải", "giảm", "tăng", "quản",
    "dẫn", "tự", "tích", "kiểm", "viết", "vận", "nghiên", "phân", "cấu",
    "bảo", "phối", "hướng", "đạt", "hoàn",
}

SOFT_TEMPLATES: Dict[str, str] = {
    "teamwork": (
        "Phối hợp với team [N] người (dev/QA/designer) để [mục tiêu], "
        "bàn giao [tính năng] đúng hạn."
    ),
    "communication": (
        "Trình bày/demo [sản phẩm] cho [đối tượng]; viết tài liệu [loại] "
        "giúp [kết quả]."
    ),
    "problem solving": (
        "Phân tích nguyên nhân gốc rễ và khắc phục [lỗi/vấn đề], giảm "
        "[chỉ số] [X%]."
    ),
    "self learning": (
        "Tự học [công nghệ] qua [khóa học/tài liệu] và áp dụng vào "
        "[dự án] trong [thời gian]."
    ),
    "time management": (
        "Hoàn thành [N] task/sprint đúng hạn trong [khoảng thời gian], "
        "song song với [việc học/đi làm]."
    ),
    "leadership": (
        "Dẫn dắt nhóm [N] người / hướng dẫn [N] thành viên mới trong "
        "[dự án]."
    ),
    "proactive": (
        "Chủ động đề xuất và triển khai [cải tiến], giúp [kết quả]."
    ),
    "critical thinking": (
        "So sánh [phương án A/B] theo [tiêu chí] trước khi chọn "
        "[giải pháp], giúp [kết quả]."
    ),
    "adaptability": (
        "Nhanh chóng làm quen [công nghệ/quy trình mới] và đóng góp vào "
        "[dự án] sau [thời gian]."
    ),
    "knowledge sharing": (
        "Tổ chức [buổi chia sẻ/tài liệu hướng dẫn] về [chủ đề] cho "
        "[N] thành viên."
    ),
    "orientation": (
        "Đề xuất lộ trình/định hướng kỹ thuật cho [dự án], dựa trên "
        "[căn cứ]."
    ),
    "decision making": (
        "Cân nhắc [phương án A/B] theo [tiêu chí], chọn [giải pháp] và "
        "ghi lại lý do cùng kết quả."
    ),
    "conflict management": (
        "Hòa giải bất đồng giữa [các bên] về [vấn đề], đạt [kết quả]."
    ),
    "negotiation": (
        "Thương lượng [phạm vi/deadline/ngân sách] với [bên liên quan], "
        "đạt [kết quả]."
    ),
}

# Cách CHỨNG MINH các kỹ năng trừu tượng bằng việc làm cụ thể.
PROVE_HINTS: Dict[str, str] = {
    "testing": (
        "Thêm unit test (pytest/JUnit/Jest) cho một dự án; ghi số test và "
        "độ phủ (coverage %) vào bullet."
    ),
    "authentication": (
        "Cài đặt đăng nhập bằng JWT/OAuth2 trong một dự án và nêu rõ cơ "
        "chế (phân quyền, refresh token...)."
    ),
    "caching": (
        "Thêm Redis/cache cho API chậm; ghi thời gian phản hồi trước/sau."
    ),
    "security": (
        "Áp dụng checklist OWASP (validate input, hash mật khẩu, rate "
        "limit) và nêu 1-2 lỗ hổng đã khắc phục."
    ),
    "error handling": (
        "Chuẩn hóa xử lý lỗi + logging (mã lỗi, middleware) và nêu kết "
        "quả (ví dụ giảm lỗi 500)."
    ),
    "database design": (
        "Vẽ ERD, chuẩn hóa schema, thêm index cho một dự án; ghi số bảng "
        "và cải thiện truy vấn."
    ),
    "api design": (
        "Thiết kế REST API có tài liệu Swagger/OpenAPI; ghi số endpoint "
        "và quy ước đặt tên/versioning."
    ),
    "ci/cd": (
        "Dựng pipeline GitHub Actions/GitLab CI (build, test, deploy) cho "
        "một repo và nêu thời gian deploy."
    ),
    "containerization": (
        "Đóng gói ứng dụng bằng Docker/docker-compose và deploy được; "
        "đính kèm Dockerfile trong repo."
    ),
    "documentation": (
        "Viết README/tài liệu API rõ ràng cho các repo chính."
    ),
    "monitoring": (
        "Thêm Prometheus/Grafana hoặc logging tập trung cho một dịch vụ."
    ),
    "performance optimization": (
        "Đo (profiling/Lighthouse), tối ưu, rồi ghi số liệu trước/sau."
    ),
    "state management": (
        "Dùng Redux/Zustand/Pinia trong một app và nêu vì sao chọn."
    ),
    "git": "Đưa các project lên GitHub, commit rõ ràng, có README.",
}


# --------------------------------------------------------------------
# CHÍNH SÁCH THEO LEVEL MỤC TIÊU
# Mỗi level có kỳ vọng CV khác nhau; không dùng chung một bộ gợi ý.
# --------------------------------------------------------------------

LEVEL_ORDER = ["intern", "fresher", "junior", "middle", "senior", "lead"]

LEVEL_ALIASES = {
    "mid": "middle", "mid-level": "middle", "jr": "junior", "sr": "senior",
    "internship": "intern", "trainee": "intern", "student": "intern",
    "entry": "fresher", "entry level": "fresher", "entry-level": "fresher",
    "tech lead": "lead", "team lead": "lead",
}

TITLE_LEVEL_KEYWORDS = [
    ("lead", ["lead", "leader", "manager", "head of", "principal",
              "trưởng nhóm", "trưởng phòng"]),
    ("senior", ["senior", "sr", "cao cấp"]),
    ("middle", ["middle", "mid", "mid-level"]),
    ("junior", ["junior", "jr"]),
    ("fresher", ["fresher", "graduate", "new grad", "entry level",
                 "mới ra trường"]),
    ("intern", ["intern", "internship", "thực tập", "trainee"]),
]

LEVEL_POLICY = {
    "intern": dict(
        label="Intern", projects_min=2, projects_ideal="2-3 dự án",
        project_priority="high", project_gap_priority="medium",
        bullets_min=2, metric_ratio=0.1, skills_range=(5, 12),
        github="high", evidence_priority="low", gpa=True,
        no_projects_text=("Intern chưa có kinh nghiệm đi làm nên dự án là "
                          "bằng chứng chính: thêm 2-3 dự án (đồ án, cá "
                          "nhân, hackathon) với mục tiêu, công nghệ, link "
                          "repo/demo."),
        summary=("Sinh viên [năm/ngành], tìm vị trí thực tập {role}. Nền "
                 "tảng về {tech}; đã làm [dự án] [kết quả]. Mong muốn học "
                 "hỏi [lĩnh vực] trong môi trường thực tế."),
        metric_example=("Xây dựng [chức năng] cho đồ án [tên] bằng [công "
                        "nghệ], [N] người dùng thử/[N] test case đạt."),
    ),
    "fresher": dict(
        label="Fresher", projects_min=2, projects_ideal="2-3 dự án",
        project_priority="high", project_gap_priority="medium",
        bullets_min=2, metric_ratio=0.3, skills_range=(6, 15),
        github="high", evidence_priority="medium", gpa=True,
        no_projects_text=("Fresher cần dự án chạy được làm bằng chứng: "
                          "thêm 2-3 dự án hoàn chỉnh (có demo/deploy, repo "
                          "rõ ràng) hoặc kinh nghiệm thực tập."),
        summary=("Fresher {role}, tốt nghiệp [ngành/trường], thành thạo "
                 "{tech}. Đã hoàn thành [N] dự án/[thời gian] thực tập "
                 "với [kết quả đo được]. Sẵn sàng đóng góp vào [mục tiêu "
                 "vị trí]."),
        metric_example=("Phát triển [tính năng] bằng [công nghệ] cho dự án "
                        "[tên]; [N] endpoint, [X%] test pass, đã deploy "
                        "lên [nền tảng]."),
    ),
    "junior": dict(
        label="Junior", projects_min=2, projects_ideal="1-2 dự án",
        project_priority="medium", project_gap_priority="low",
        bullets_min=3, metric_ratio=0.4, skills_range=(8, 18),
        github="medium", evidence_priority="medium", gpa=False,
        no_projects_text=("Nếu kinh nghiệm công ty còn ít, thêm 1-2 dự án "
                          "cá nhân/open source để bổ sung bằng chứng."),
        summary=("{years} năm kinh nghiệm {role}, làm việc với {tech}. "
                 "Đã [xây dựng/bảo trì] [tính năng/hệ thống] giúp [kết quả "
                 "đo được]. Đang phát triển theo hướng [chuyên sâu]."),
        metric_example=("Phát triển [N] tính năng [tên] bằng [công nghệ], "
                        "giảm [chỉ số] [X%]; sửa [N] bug ưu tiên cao."),
    ),
    "middle": dict(
        label="Middle", projects_min=1, projects_ideal="0-2 dự án chọn lọc",
        project_priority="low", project_gap_priority="low",
        bullets_min=3, metric_ratio=0.5, skills_range=(8, 20),
        github="low", evidence_priority="high", gpa=False,
        no_projects_text=("Với level Middle, kinh nghiệm công ty là chính; "
                          "có thể thêm 1 dự án/OSS chọn lọc nếu thể hiện "
                          "chiều sâu kỹ thuật."),
        summary=("{role} {years} năm kinh nghiệm, thiết kế và vận hành "
                 "[hệ thống/module] với {tech}. Sở hữu [mảng] end-to-end, "
                 "[kết quả đo được: hiệu năng/chi phí/độ ổn định], hỗ trợ "
                 "[N] thành viên junior."),
        metric_example=("Thiết kế và triển khai [hệ thống/module] bằng "
                        "[công nghệ], phục vụ [N] người dùng/[N] req/s; "
                        "giảm [chỉ số] [X%]."),
    ),
    "senior": dict(
        label="Senior", projects_min=0, projects_ideal="không bắt buộc",
        project_priority="low", project_gap_priority="low",
        bullets_min=4, metric_ratio=0.6, skills_range=(8, 20),
        github="low", evidence_priority="high", gpa=False,
        no_projects_text=("Senior không cần mục dự án riêng; nhấn mạnh hệ "
                          "thống/sản phẩm đã dẫn dắt trong mục Kinh nghiệm."),
        summary=("{role} {years} năm kinh nghiệm, dẫn dắt thiết kế kiến "
                 "trúc [hệ thống] với {tech}. Mentor [N] kỹ sư, phối hợp "
                 "[PM/đối tác]; tạo tác động [doanh thu/chi phí/độ ổn "
                 "định: số liệu]."),
        metric_example=("Dẫn dắt thiết kế kiến trúc [hệ thống] phục vụ "
                        "[N] người dùng; giảm chi phí hạ tầng [X%], nâng "
                        "uptime lên [99.x%]."),
    ),
    "lead": dict(
        label="Lead", projects_min=0, projects_ideal="không bắt buộc",
        project_priority="low", project_gap_priority="low",
        bullets_min=4, metric_ratio=0.6, skills_range=(6, 16),
        github="low", evidence_priority="high", gpa=False,
        no_projects_text=("Lead không cần mục dự án; nêu sản phẩm/chương "
                          "trình đã dẫn dắt và kết quả của team."),
        summary=("{role} {years} năm kinh nghiệm, quản lý team [N] người, "
                 "giao [N] dự án/[sản phẩm]. Xây dựng [quy trình], phát "
                 "triển năng lực team ({tech}); đạt [kết quả kinh "
                 "doanh/delivery: số liệu]."),
        metric_example=("Quản lý team [N] kỹ sư, giao [N] dự án đúng hạn; "
                        "tuyển [N] người, giảm [chỉ số] [X%] nhờ [quy "
                        "trình]."),
    ),
}

# Bằng chứng CV cần có theo từng level. kw hỗ trợ "*" (tiền tố) và
# "re:<regex>". metric=True: cần có số liệu.
LEVEL_EVIDENCE = {
    "intern": [
        dict(label="Tinh thần học hỏi / hoạt động ngoài lớp",
             kw=["khóa học", "course", "coursera", "udemy", "tự học",
                 "self-learn*", "hackathon", "câu lạc bộ", "club",
                 "open source", "cuộc thi", "competition"],
             tmpl="Nêu khóa học/hackathon/CLB đã tham gia và điều bạn "
                  "làm được sau đó."),
    ],
    "fresher": [
        dict(label="Dự án chạy được (demo/deploy)",
             kw=["deploy*", "triển khai", "hosted", "vercel", "heroku",
                 "render", "docker", "demo", "live"],
             tmpl="Deploy dự án lên Vercel/Render/VPS và ghi link demo "
                  "vào CV."),
        dict(label="Làm việc nhóm với Git",
             kw=["team", "nhóm", "group", "pull request", "git*",
                 "collaborat*"],
             tmpl="Mô tả vai trò trong nhóm [N] người và cách phối hợp "
                  "(Git branch, PR, họp nhóm)."),
    ],
    "junior": [
        dict(label="Hoàn thành tính năng độc lập",
             kw=["feature*", "tính năng", "module", "endpoint*", "api"],
             tmpl="Mô tả [tính năng] bạn tự hoàn thành từ yêu cầu đến "
                  "release."),
        dict(label="Chất lượng code (test/review/sửa lỗi)",
             kw=["test*", "review*", "bug*", "debug*", "refactor*",
                 "fix*", "sửa lỗi"],
             tmpl="Nêu số bug đã sửa, test đã viết hoặc review bạn đã "
                  "tham gia."),
        dict(label="Quy trình nhóm (agile/PR/sprint)",
             kw=["agile", "scrum", "sprint*", "pull request*",
                 "code review", "kanban", "jira"],
             tmpl="Ghi quy trình làm việc: sprint [N] tuần, PR review, "
                  "Jira."),
    ],
    "middle": [
        dict(label="Quyết định thiết kế / giải pháp",
             kw=["design*", "architect*", "thiết kế", "kiến trúc",
                 "trade-off", "schema", "system design"],
             tmpl="Nêu 1 quyết định thiết kế: vấn đề → phương án đã cân "
                  "nhắc → lý do chọn → kết quả."),
        dict(label="Làm chủ một module/mảng (ownership)",
             kw=["own*", "led", "lead*", "chịu trách nhiệm", "dẫn dắt",
                 "chủ trì", "end-to-end"],
             tmpl="Ghi rõ bạn sở hữu [module/mảng] từ thiết kế đến vận "
                  "hành."),
        dict(label="Giải quyết vấn đề phức tạp có số liệu",
             kw=["re:\\d+\\s*%", "re:\\d+x\\b", "latency", "throughput",
                 "giảm", "tăng", "reduc*", "improv*"],
             tmpl="Nêu vấn đề khó, cách xử lý và kết quả đo được (giảm "
                  "[X%] latency...)."),
        dict(label="Hỗ trợ/review cho junior",
             kw=["mentor*", "hướng dẫn", "onboard*", "code review",
                 "review*"],
             tmpl="Ghi số junior bạn hướng dẫn/review và kết quả."),
    ],
    "senior": [
        dict(label="Dẫn dắt kiến trúc hệ thống",
             kw=["architect*", "kiến trúc", "system design", "microservice*",
                 "scalab*", "high availability"],
             tmpl="Nêu hệ thống bạn thiết kế kiến trúc, quy mô và ràng "
                  "buộc chính."),
        dict(label="Phối hợp liên nhóm/stakeholder",
             kw=["cross-team", "cross-functional", "stakeholder*",
                 "product manager", "đối tác", "nhiều team", "liên nhóm"],
             tmpl="Ghi các nhóm/bên liên quan bạn phối hợp và kết quả "
                  "chung."),
        dict(label="Mentoring",
             kw=["mentor*", "hướng dẫn", "coach*", "đào tạo", "onboard*"],
             tmpl="Mentor [N] kỹ sư; [N] người được thăng cấp/độc lập "
                  "nhờ bạn."),
        dict(label="Tác động kinh doanh",
             kw=["revenue", "doanh thu", "cost", "chi phí", "uptime", "sla",
                 "conversion", "retention", "người dùng", "users"],
             tmpl="Gắn kết quả kỹ thuật với kinh doanh: giảm chi phí "
                  "[X%], tăng doanh thu/uptime [..]."),
    ],
    "lead": [
        dict(label="Quản lý người / quy mô team",
             kw=["re:team of \\d+", "re:\\d+\\s*(?:members|engineers|"
                 "developers|người|thành viên)", "managed", "quản lý",
                 "people manage*", "direct report*"],
             tmpl="Ghi quy mô team bạn dẫn dắt: [N] kỹ sư, [N] direct "
                  "report."),
        dict(label="Tuyển dụng / phát triển năng lực team",
             kw=["hiring", "recruit*", "interview*", "tuyển", "phỏng vấn",
                 "mentor*", "đào tạo", "thăng cấp"],
             tmpl="Tuyển [N] người, đào tạo/thăng cấp [N] người."),
        dict(label="Delivery / roadmap / quy trình",
             kw=["roadmap", "delivery", "okr", "kpi", "planning", "lộ trình",
                 "quy trình", "process*"],
             tmpl="Xây dựng [quy trình/roadmap]; giao [N] dự án đúng hạn "
                  "(tỷ lệ [X%])."),
        dict(label="Chiến lược & tác động kinh doanh",
             kw=["strateg*", "chiến lược", "budget", "ngân sách", "revenue",
                 "doanh thu", "cost", "chi phí"],
             tmpl="Nêu quyết định chiến lược kỹ thuật và tác động tới "
                  "doanh thu/chi phí."),
    ],
}

ACADEMIC_PROJECT_WORDS = [
    "đồ án", "bài tập lớn", "assignment", "course project", "khóa học",
    "coursera", "udemy", "tutorial", "todo app", "to-do", "clone",
    "thesis", "luận văn", "capstone", "môn học",
]


class CVAdvisor:
    """Tạo gợi ý chỉnh sửa CV từ kết quả phân tích."""

    MAX_BULLET_REWRITES = 8

    def __init__(self) -> None:
        self._ci = CareerIntelligence()

    # ================================================================
    # PUBLIC API
    # ================================================================

    def advise(
        self,
        candidate_profile: Dict[str, Any],
        requirements: Dict[str, Any],
        analysis: Dict[str, Any],
    ) -> Dict[str, Any]:
        if not isinstance(candidate_profile, dict):
            raise ValueError("candidate_profile phải là dict.")
        if not isinstance(analysis, dict):
            raise ValueError("analysis phải là dict (kết quả analyze()).")

        requirements = requirements if isinstance(requirements, dict) else {}

        ctx = self._build_context(candidate_profile, requirements, analysis)

        suggestions: List[Dict[str, Any]] = []
        suggestions += self._check_personal(ctx)
        suggestions += self._check_summary(ctx)
        suggestions += self._check_skills(ctx)
        suggestions += self._check_tools(ctx)
        suggestions += self._check_soft_skills(ctx)
        suggestions += self._check_experience(ctx)
        suggestions += self._check_projects(ctx)
        suggestions += self._check_education(ctx)
        suggestions += self._check_certifications(ctx)
        suggestions += self._check_languages(ctx)
        suggestions += self._check_responsibilities(ctx)
        suggestions += self._check_nice_to_have(ctx)
        suggestions += self._check_level_fit(ctx)
        suggestions += self._check_level_evidence(ctx)
        suggestions += self._check_education_level(ctx)
        suggestions += self._check_expected_achievements(ctx)

        bullet_suggestions, rewrites = self._check_bullets(ctx)
        suggestions += bullet_suggestions

        suggestions = self._finalize(suggestions, ctx)

        keywords = self._keyword_plan(ctx)

        quick_wins = [
            s for s in suggestions
            if s["effort"] == "low" and s["priority"] in ("high", "medium")
        ][:5]

        score = analysis.get("score", {}) or {}

        return {
            "target": analysis.get("target", {}),
            "overall_score": score.get("overall"),
            "headline": self._headline(suggestions, ctx),
            "target_level": ctx["level"],
            "level_source": ctx["level_source"],
            "level_guide": {"label": ctx["policy"]["label"]},
            # Cảnh báo của analyze() do main.py in riêng; ở đây chỉ giữ
            # các ghi chú thuộc về gợi ý (tránh in hai lần).
            "notes": ctx["level_notes"] + ctx["role_notes"],
            "suggestions": suggestions,
            "quick_wins": quick_wins,
            "keywords": keywords,
            "bullet_rewrites": rewrites,
            "stats": {
                "total": len(suggestions),
                "high": sum(s["priority"] == "high" for s in suggestions),
                "medium": sum(s["priority"] == "medium" for s in suggestions),
                "low": sum(s["priority"] == "low" for s in suggestions),
            },
        }

    # ================================================================
    # CONTEXT
    # ================================================================

    def _build_context(
        self,
        profile: Dict[str, Any],
        requirements: Dict[str, Any],
        analysis: Dict[str, Any],
    ) -> Dict[str, Any]:
        candidate = self._ci._normalize_candidate(profile)

        career = profile.get("career") or {}
        stage = (career.get("career_stage") or "").lower()
        years = candidate.get("experience_years") or 0.0

        priorities = analysis.get("priorities", []) or []
        top_categories = [p.get("category") for p in priorities[:2]]
        gains = {
            p.get("category"): p.get("potential_gain", 0) for p in priorities
        }

        summary = profile.get("summary") or {}
        summary_text = (
            summary.get("text") if isinstance(summary, dict) else summary
        ) or ""

        # Dùng tên công nghệ CỤ THỂ của ứng viên (vd "Python"), không dùng
        # tên khái niệm trừu tượng của framework (vd "Một ngôn ngữ backend").
        matched_skills = []
        for key in ("skill_analysis", "tool_analysis"):
            for item in (analysis.get(key) or {}).get("items", []):
                if item.get("status") != "matched":
                    continue
                concrete = item.get("matched_by") or item["name"]
                matched_skills.append(
                    self._display_skill(candidate["skills"], concrete)
                )
        matched_skills = self._uniq(matched_skills)

        level, level_source = self._resolve_level(
            requirements, analysis, years, stage
        )
        level_notes = []
        if level_source != "khai báo":
            level_notes.append(
                f"Level mục tiêu được {level_source}: '{level}'. Hãy nêu "
                f"level cụ thể (intern/fresher/junior/middle/senior/lead) "
                f"để gợi ý chính xác hơn."
            )

        role_notes = self._role_mismatch_note(
            career.get("target_role"),
            (analysis.get("target") or {}).get("role"),
        )

        return {
            "role_notes": role_notes,
            "level": level,
            "level_source": level_source,
            "level_notes": level_notes,
            "policy": LEVEL_POLICY[level],
            "profile": profile,
            "requirements": requirements,
            "analysis": analysis,
            "candidate": candidate,
            "stage": stage,
            "years": years,
            "is_junior": (
                stage in ("student", "entry", "intern", "fresher")
                or years < 1.0
            ),
            "top_categories": top_categories,
            "gains": gains,
            "summary_text": str(summary_text).strip(),
            "matched_skills": matched_skills,
            "target_role": (
                (analysis.get("target") or {}).get("role")
                or career.get("target_role")
                or ""
            ),
        }

    # ================================================================
    # PERSONAL
    # ================================================================

    def _check_personal(self, ctx) -> List[Dict[str, Any]]:
        personal = ctx["profile"].get("personal") or {}
        out = []

        for key, label, pri in (
            ("name", "họ tên", "high"),
            ("email", "email", "high"),
            ("phone", "số điện thoại", "high"),
        ):
            if not personal.get(key):
                out.append(self._s(
                    "personal", f"missing_{key}", pri, "low",
                    f"Không tìm thấy {label} trong CV.",
                    f"Đặt {label} ở đầu CV, dòng riêng, dễ đọc bằng máy "
                    f"(không nhúng trong ảnh/icon).",
                ))

        if not personal.get("github"):
            repos = [
                p for p in (ctx["profile"].get("projects") or [])
                if isinstance(p, dict)
                and "github.com" in str(p.get("repository") or "").lower()
            ]
            if repos:
                out.append(self._s(
                    "personal", "missing_github_profile", "low", "low",
                    f"CV có link repo GitHub ({len(repos)} dự án) nhưng "
                    f"chưa có link GitHub profile.",
                    "Thêm link profile (github.com/<username>) để nhà "
                    "tuyển dụng xem toàn bộ repo của bạn.",
                ))
            else:
                out.append(self._s(
                    "personal", "missing_github", ctx["policy"]["github"],
                    "low",
                    "Chưa có link GitHub (quan trọng với vị trí IT).",
                    "Thêm link GitHub profile và ghim 2-3 repo tốt nhất; "
                    "mỗi repo cần README rõ ràng.",
                ))

        if not personal.get("linkedin"):
            out.append(self._s(
                "personal", "missing_linkedin", "low", "low",
                "Chưa có link LinkedIn.",
                "Thêm link LinkedIn (nếu profile đã được cập nhật khớp CV).",
            ))

        return out

    # ================================================================
    # SUMMARY
    # ================================================================

    def _check_summary(self, ctx) -> List[Dict[str, Any]]:
        text = ctx["summary_text"]
        role = ctx["target_role"]
        out = []

        top_skills = ctx["matched_skills"][:4] or ctx["candidate"]["skills"][:4]
        template = self._summary_template(ctx, top_skills)

        if not text:
            out.append(self._s(
                "summary", "missing_summary",
                "high" if ctx["is_junior"] else "medium", "low",
                "CV chưa có phần giới thiệu (Summary/Objective).",
                "Thêm 2-3 câu đầu CV: bạn là ai, mạnh về gì, muốn làm vị trí "
                "nào.",
                example=template,
            ))
            return out

        words = len(text.split())

        if words < 15:
            out.append(self._s(
                "summary", "summary_too_short", "medium", "low",
                f"Summary quá ngắn ({words} từ).",
                "Mở rộng thành 2-3 câu (35-70 từ): vai trò mục tiêu, "
                "công nghệ chính, điểm nổi bật.",
                example=template,
            ))
        elif words > 90:
            out.append(self._s(
                "summary", "summary_too_long", "low", "low",
                f"Summary quá dài ({words} từ).",
                "Rút gọn còn 35-70 từ; chuyển chi tiết xuống Experience/"
                "Projects.",
            ))

        if role and not self._mentions(text, role):
            out.append(self._s(
                "summary", "summary_missing_target_role", "medium", "low",
                f"Summary chưa nhắc đúng vị trí mục tiêu '{role}'.",
                "Dùng đúng chức danh trong tin tuyển dụng ở câu đầu của "
                "Summary (giúp ATS và nhà tuyển dụng nhận ra ngay).",
                example=template,
            ))

        summary_skills = [
            s for s in ctx["matched_skills"][:3]
            if not self._mentions(text, s)
        ]
        if summary_skills and words >= 15:
            out.append(self._s(
                "summary", "summary_missing_key_skills", "low", "low",
                "Summary chưa nhắc các kỹ năng khớp yêu cầu: "
                + ", ".join(summary_skills) + ".",
                "Chèn 2-3 kỹ năng mạnh nhất đã khớp yêu cầu vào Summary.",
            ))

        return out

    def _summary_template(self, ctx, skills: List[str]) -> str:
        years = ctx["years"]
        return ctx["policy"]["summary"].format(
            role=ctx["target_role"] or "[vị trí mục tiêu]",
            tech=", ".join(skills) if skills else "[công nghệ chính]",
            years=f"{years:g}" if years >= 1 else "[N]",
        )

    # ================================================================
    # SKILLS / TOOLS
    # ================================================================

    def _check_skills(self, ctx) -> List[Dict[str, Any]]:
        out = []
        analysis = ctx["analysis"].get("skill_analysis") or {}
        skills = ctx["candidate"]["skills"]

        lo, hi = ctx["policy"]["skills_range"]
        if len(skills) < lo:
            out.append(self._s(
                "skills", "few_skills",
                "high" if len(skills) < 3 else "medium", "low",
                f"Mục Skills chỉ có {len(skills)} kỹ năng.",
                "Liệt kê đầy đủ ngôn ngữ, framework, database, công cụ bạn "
                "THỰC SỰ đã dùng (kể cả trong đồ án/dự án cá nhân).",
            ))
        elif len(skills) > hi:
            out.append(self._s(
                "skills", "too_many_skills", "medium", "low",
                f"Mục Skills có {len(skills)} kỹ năng, dễ bị loãng.",
                f"Giữ khoảng {lo}-{hi} kỹ năng liên quan nhất tới vị trí; bỏ kỹ năng "
                "lỗi thời/không liên quan.",
            ))
        elif (
            len(skills) >= 12
            and len(ctx["profile"].get("skill_groups") or {}) < 2
        ):
            # Chỉ nhắc khi CV liệt kê một danh sách phẳng dài; CV đã chia
            # nhóm sẵn thì không gợi ý nữa.
            out.append(self._s(
                "skills", "group_skills", "low", "low",
                f"Danh sách {len(skills)} kỹ năng chưa được chia nhóm.",
                "Cân nhắc chia nhóm (Languages / Frameworks / Databases / "
                "Tools) để nhà tuyển dụng quét nhanh hơn.",
            ))

        self._skill_gap_suggestions(ctx, analysis, "skills", out)
        self._unproven_skill_suggestion(ctx, out)
        return out

    def _check_tools(self, ctx) -> List[Dict[str, Any]]:
        out = []
        analysis = ctx["analysis"].get("tool_analysis") or {}
        self._skill_gap_suggestions(ctx, analysis, "tools", out)
        return out

    def _skill_gap_suggestions(
        self,
        ctx,
        analysis: Dict[str, Any],
        section: str,
        out: List[Dict[str, Any]],
    ) -> None:
        category_key = "skill" if section == "skills" else "tool"
        gain = ctx["gains"].get(category_key, 0)
        top = category_key in ctx["top_categories"]

        add_if_true: List[str] = []
        learn: List[Tuple[str, str]] = []

        for item in analysis.get("items", []):
            name, status = item["name"], item["status"]
            important = item.get("importance", "must_have") == "must_have"

            if status == "partial" and item.get("via") == "evidence":
                add_if_true.append(name)
            elif status == "partial" and item.get("via") == "same_vendor":
                continue
            elif status == "missing":
                learn.append((name, "must" if important else "nice"))

        if add_if_true:
            out.append(self._s(
                section, f"{category_key}_mentioned_not_listed",
                "high" if top else "medium", "low",
                "Đã nhắc tới trong mô tả nhưng CHƯA ghi rõ ở mục "
                f"{'Skills' if section == 'skills' else 'Tools'}: "
                + ", ".join(add_if_true) + ".",
                "Nếu bạn thực sự đã làm, hãy thêm tên công nghệ/kỹ năng này "
                "vào mục Skills VÀ giữ bullet chứng minh (ATS quét cả hai).",
                items=add_if_true, gain=gain,
            ))

        if learn:
            must = [n for n, k in learn if k == "must"]
            nice = [n for n, k in learn if k == "nice"]

            if must:
                out.append(self._s(
                    section, f"{category_key}_missing_must",
                    "high" if top else "medium", "high",
                    "Chưa thấy trong CV (yêu cầu bắt buộc): "
                    + ", ".join(must) + ".",
                    "Nếu ĐÃ dùng thật: thêm vào Skills + 1 bullet chứng "
                    "minh. Nếu CHƯA: học và làm một mini-project rồi mới "
                    "ghi vào CV — không ghi kỹ năng chưa dùng.",
                    items=must, gain=gain,
                    prove=self._prove_hints(must),
                ))
            if nice:
                out.append(self._s(
                    section, f"{category_key}_missing_nice", "low", "high",
                    "Chưa thấy (điểm cộng): " + ", ".join(nice) + ".",
                    "Cân nhắc bổ sung sau khi đã đáp ứng các yêu cầu bắt "
                    "buộc.",
                    items=nice,
                ))

    def _skill_order_suggestion(self, ctx, out) -> None:
        skills = ctx["candidate"]["skills"]
        required_matched = [
            m for m in ctx["matched_skills"]
        ]
        if len(skills) < 8 or not required_matched:
            return

        folded = [self._fold(s) for s in skills]
        buried = []
        for name in required_matched:
            key = self._fold(name)
            for idx, skill in enumerate(folded):
                if skill == key or key in skill:
                    if idx >= 8:
                        buried.append(name)
                    break

        if buried:
            out.append(self._s(
                "skills", "reorder_skills", "low", "low",
                "Kỹ năng khớp yêu cầu nằm quá thấp trong danh sách: "
                + ", ".join(buried[:5]) + ".",
                "Đưa các kỹ năng khớp JD lên đầu danh sách/nhóm.",
            ))

    def _unproven_skill_suggestion(self, ctx, out) -> None:
        """Kỹ năng khớp yêu cầu nhưng chỉ nằm trong Skills, không có
        bằng chứng trong Experience/Projects."""
        evidence = ctx["candidate"]["evidence_text"]
        if not evidence.strip():
            return

        has_repo = any(
            host in evidence
            for host in ("github.com", "gitlab.com", "bitbucket.org")
        )

        unproven = []
        for name in ctx["matched_skills"]:
            key = self._fold(name)
            if len(key) < 2:
                continue
            if has_repo and key in ("git", "github", "gitlab", "bitbucket"):
                continue
            if not self._ci._has_keyword(evidence, key):
                unproven.append(name)

        if unproven:
            out.append(self._s(
                "skills", "skills_without_evidence", "medium", "medium",
                "Kỹ năng khớp yêu cầu nhưng chưa có bằng chứng trong "
                "Experience/Projects: " + ", ".join(unproven[:8]) + ".",
                "Với mỗi kỹ năng quan trọng, thêm ít nhất 1 bullet nêu bạn "
                "đã dùng nó để làm gì và kết quả ra sao.",
                items=unproven,
            ))

    def _prove_hints(self, names: List[str]) -> Dict[str, str]:
        hints = {}
        for name in names:
            key = self._fold(name)
            if key in PROVE_HINTS:
                hints[name] = PROVE_HINTS[key]
        return hints

    # ================================================================
    # SOFT SKILLS
    # ================================================================

    def _check_soft_skills(self, ctx) -> List[Dict[str, Any]]:
        analysis = ctx["analysis"].get("soft_skill_analysis") or {}
        missing = [
            i["name"] for i in analysis.get("items", [])
            if i["status"] == "missing"
        ]
        if not missing:
            return []

        examples = {}
        for name in missing:
            canonical = self._ci._canonical_soft_skill(name)
            if canonical and canonical in SOFT_TEMPLATES:
                examples[name] = SOFT_TEMPLATES[canonical]

        return [self._s(
            "soft_skills", "soft_skill_not_shown",
            "medium" if "soft_skill" in ctx["top_categories"] else "low",
            "medium",
            "Chưa thể hiện được các kỹ năng mềm: " + ", ".join(missing) + ".",
            "Đừng chỉ liệt kê kỹ năng mềm — hãy LỒNG vào bullet kinh nghiệm/"
            "dự án bằng hành động cụ thể (nếu có thật).",
            items=missing, prove=examples,
        )]

    # ================================================================
    # EXPERIENCE
    # ================================================================

    def _check_experience(self, ctx) -> List[Dict[str, Any]]:
        out = []
        profile = ctx["profile"]
        experience = profile.get("experience") or []
        analysis = ctx["analysis"].get("experience_analysis") or {}

        undated = [
            e for e in experience
            if isinstance(e, dict)
            and not (e.get("date") or e.get("start_date"))
        ]
        if undated:
            out.append(self._s(
                "experience", "experience_missing_dates", "high", "low",
                f"{len(undated)} mục kinh nghiệm thiếu mốc thời gian.",
                "Ghi rõ 'MM/YYYY - MM/YYYY' cho từng vị trí (hệ thống dùng "
                "mốc này để tính số năm kinh nghiệm).",
            ))

        for exp in experience:
            if not isinstance(exp, dict):
                continue
            label = exp.get("position") or exp.get("company") or "mục này"
            bullets = exp.get("description") or []
            if not exp.get("position") or not exp.get("company"):
                out.append(self._s(
                    "experience", "experience_missing_header", "medium",
                    "low",
                    f"Mục kinh nghiệm '{label}' thiếu chức danh hoặc tên "
                    f"công ty.",
                    "Ghi rõ theo mẫu: Chức danh — Công ty — Thời gian.",
                ))
            need = ctx["policy"]["bullets_min"]
            if len(bullets) < need:
                out.append(self._s(
                    "experience", "experience_few_bullets", "low", "low",
                    f"'{label}' chỉ có {len(bullets)} bullet mô tả.",
                    f"Level {ctx['policy']['label']} nên có ít nhất {need} "
                    f"bullet cho mỗi vị trí, ưu tiên thành tựu thay vì "
                    f"liệt kê nhiệm vụ.",
                ))

        status = analysis.get("status")
        gap = analysis.get("gap") or 0

        if status == "below_requirement":
            out.append(self._s(
                "experience", "experience_below_requirement",
                "high" if "experience" in ctx["top_categories"] else "medium",
                "high",
                f"Thiếu khoảng {gap:g} năm kinh nghiệm so với mức tối thiểu "
                f"của vị trí.",
                "Bù bằng bằng chứng thực tế: dự án có người dùng thật, đóng "
                "góp open source, freelance, thực tập. Đưa Projects lên "
                "trước Education nếu ít kinh nghiệm đi làm. Hoặc cân nhắc "
                "ứng tuyển level thấp hơn.",
            ))
        elif status == "above_range":
            out.append(self._s(
                "experience", "experience_above_range", "low", "low",
                "Kinh nghiệm của bạn vượt khung của level này.",
                "Cân nhắc ứng tuyển level cao hơn, hoặc nhấn mạnh khả năng "
                "dẫn dắt/mentor để tránh bị coi là 'overqualified'.",
            ))

        return out

    # ================================================================
    # PROJECTS
    # ================================================================

    def _check_projects(self, ctx) -> List[Dict[str, Any]]:
        out = []
        projects = [
            p for p in (ctx["profile"].get("projects") or [])
            if isinstance(p, dict)
        ]

        if not projects:
            out.append(self._s(
                "projects", "no_projects",
                ctx["policy"]["project_priority"], "high",
                "CV chưa có dự án nào.",
                ctx["policy"]["no_projects_text"],
            ))
            return out

        no_tech = [p.get("name") or "?" for p in projects
                   if not (p.get("technologies") or [])]
        no_link = [p.get("name") or "?" for p in projects
                   if not (p.get("repository") or "").strip()]
        no_desc = [p.get("name") or "?" for p in projects
                   if not (p.get("description") or [])]

        if no_desc:
            out.append(self._s(
                "projects", "project_no_description", "high", "low",
                "Dự án chưa có mô tả: " + ", ".join(no_desc) + ".",
                "Mỗi dự án cần 2-4 bullet: bạn làm gì, bằng công nghệ nào, "
                "kết quả ra sao.",
            ))
        if no_tech:
            out.append(self._s(
                "projects", "project_no_technologies", "medium", "low",
                "Dự án chưa nêu công nghệ: " + ", ".join(no_tech) + ".",
                "Thêm dòng 'Technologies: ...' cho từng dự án (cũng giúp "
                "ATS nhận diện kỹ năng).",
            ))
        if no_link and len(no_link) == len(projects):
            out.append(self._s(
                "projects", "project_no_repo", "medium", "low",
                "Không dự án nào có link repo/demo.",
                "Thêm link GitHub/demo; nhà tuyển dụng IT thường kiểm tra "
                "code thật.",
            ))

        need = ctx["policy"]["projects_min"]
        if len(projects) < need:
            out.append(self._s(
                "projects", "few_projects",
                ctx["policy"]["project_gap_priority"], "high",
                f"Mới có {len(projects)} dự án; level "
                f"{ctx['policy']['label']} nên có khoảng "
                f"{ctx['policy']['projects_ideal']}.",
                "Bổ sung dự án khác nhau về công nghệ/độ khó để thể hiện "
                "sự đa dạng kỹ năng.",
            ))

        return out

    # ================================================================
    # EDUCATION / CERTIFICATIONS / LANGUAGES
    # ================================================================

    def _check_education(self, ctx) -> List[Dict[str, Any]]:
        out = []
        education = ctx["profile"].get("education") or []

        if not education:
            out.append(self._s(
                "education", "missing_education", "medium", "low",
                "CV chưa có mục Học vấn.",
                "Ghi trường, bằng cấp, chuyên ngành, năm tốt nghiệp (hoặc "
                "dự kiến).",
            ))
            return out

        analysis = ctx["analysis"].get("education_analysis") or {}
        missing = [
            i["name"] for i in analysis.get("items", [])
            if i["status"] == "missing"
        ]
        if missing:
            out.append(self._s(
                "education", "education_requirement_gap", "medium", "low",
                "Chưa thấy trình độ học vấn yêu cầu: " + ", ".join(missing)
                + ".",
                "Ghi rõ bằng cấp + chuyên ngành + năm tốt nghiệp (dự kiến). "
                "Nếu chuyên ngành khác, nêu các môn/chứng chỉ liên quan.",
            ))

        for edu in education:
            if isinstance(edu, dict) and edu.get("degree") and not (
                edu.get("field") or edu.get("major")
            ):
                out.append(self._s(
                    "education", "education_missing_major", "low", "low",
                    "Mục học vấn chưa ghi rõ chuyên ngành.",
                    "Ghi chuyên ngành (vd: Kỹ thuật phần mềm/Khoa học máy "
                    "tính) để khớp yêu cầu.",
                ))
                break

        return out

    def _check_certifications(self, ctx) -> List[Dict[str, Any]]:
        analysis = ctx["analysis"].get("certification_analysis") or {}
        missing = [
            i["name"] for i in analysis.get("items", [])
            if i["status"] == "missing"
        ]
        partial = [
            (i["name"], i.get("matched_by", ""))
            for i in analysis.get("items", [])
            if i["status"] == "partial"
        ]
        out = []

        if missing:
            out.append(self._s(
                "certifications", "certification_missing", "medium", "high",
                "Chưa có chứng chỉ yêu cầu: " + ", ".join(missing) + ".",
                "Lên kế hoạch thi chứng chỉ; trong lúc chờ, ghi 'Đang ôn "
                "thi — dự kiến [tháng/năm]' nếu đúng sự thật.",
            ))
        for name, have in partial:
            out.append(self._s(
                "certifications", "certification_partial", "low", "high",
                f"Yêu cầu '{name}', bạn có '{have}' (cùng hãng, khác chứng "
                f"chỉ).",
                "Ghi rõ chứng chỉ bạn đang có và kế hoạch nâng cấp.",
            ))

        return out

    def _check_languages(self, ctx) -> List[Dict[str, Any]]:
        analysis = ctx["analysis"].get("language_analysis") or {}
        missing = [
            i["name"] for i in analysis.get("items", [])
            if i["status"] == "missing"
        ]
        if not missing:
            return []

        return [self._s(
            "languages", "language_missing", "medium", "low",
            "Chưa thấy ngoại ngữ yêu cầu: " + ", ".join(missing) + ".",
            "Thêm mục Ngoại ngữ kèm trình độ cụ thể (IELTS/TOEIC/JLPT hoặc "
            "CEFR: B1, B2...).",
        )]

    # ================================================================
    # RESPONSIBILITIES / NICE-TO-HAVE
    # ================================================================

    def _check_responsibilities(self, ctx) -> List[Dict[str, Any]]:
        analysis = ctx["analysis"].get("responsibility_analysis") or {}
        if not analysis.get("active"):
            return []

        missing = analysis.get("missing") or []
        if not missing:
            return []

        return [self._s(
            "experience", "responsibilities_not_shown", "medium", "medium",
            "Chưa có bằng chứng cho các trách nhiệm công việc: "
            + "; ".join(missing[:4]) + (" ..." if len(missing) > 4 else ""),
            "Nếu bạn ĐÃ làm việc này thật (dự án, thực tập, đồ án), hãy "
            "thêm một bullet mô tả cụ thể. Nếu chưa, hãy đặt làm mục tiêu "
            "kế tiếp — đừng ghi khi chưa làm.",
            items=missing,
        )]

    def _check_nice_to_have(self, ctx) -> List[Dict[str, Any]]:
        preferred = ctx["analysis"].get("preferred_analysis") or {}
        missing = [m["name"] for m in preferred.get("missing", [])]
        if not missing:
            return []

        return [self._s(
            "skills", "preferred_missing", "low", "high",
            "Điểm cộng trong JD chưa thấy trong CV: " + ", ".join(missing)
            + ".",
            "Ưu tiên sau khi đã đáp ứng yêu cầu bắt buộc; nếu đã có kinh "
            "nghiệm thật thì ghi rõ.",
            items=missing,
        )]

    # ================================================================
    # LEVEL-AWARE CHECKS
    # ================================================================

    GENERIC_ROLE_WORDS = {
        "engineer", "developer", "software", "senior", "junior", "intern",
        "fresher", "lead", "middle", "specialist", "staff",
    }

    def _role_mismatch_note(self, cv_role, target_role) -> List[str]:
        """Báo khi mục tiêu ghi trong CV khác hẳn vị trí đang đối chiếu."""
        if not cv_role or not target_role:
            return []

        def tokens(value):
            return {
                t for t in re.findall(r"[a-zà-ỹ]+", self._fold(value))
                if len(t) >= 4 and t not in self.GENERIC_ROLE_WORDS
            }

        a, b = tokens(cv_role), tokens(target_role)
        if a and b and not (a & b):
            return [
                f"CV nêu mục tiêu '{cv_role}' nhưng bạn đang đối chiếu với "
                f"'{target_role}'; gợi ý bên dưới theo vị trí đang chọn."
            ]
        return []

    def _canon_level(self, raw: Any) -> Optional[str]:
        if not raw:
            return None
        text = self._fold(raw)
        if text in LEVEL_ORDER:
            return text
        return LEVEL_ALIASES.get(text)

    def _resolve_level(self, requirements, analysis, years, stage):
        """Trả (level, nguồn). Ưu tiên: khai báo > chức danh > số năm
        yêu cầu > giả định theo kinh nghiệm hiện tại."""
        target = analysis.get("target") or {}

        for raw in (
            requirements.get("selected_level"),
            target.get("level"),
            requirements.get("level"),
        ):
            level = self._canon_level(raw)
            if level:
                return level, "khai báo"

        title = self._fold(" ".join(
            str(x) for x in (requirements.get("title"), target.get("role"))
            if x
        ))
        for level, keywords in TITLE_LEVEL_KEYWORDS:
            if any(self._ci._has_keyword(title, kw) for kw in keywords):
                return level, "suy ra từ chức danh"

        required = (analysis.get("experience_analysis") or {}).get(
            "required"
        ) or {}
        minimum = required.get("minimum_years")
        if minimum is not None:
            return self._level_from_years(minimum), \
                "suy ra từ số năm kinh nghiệm yêu cầu"

        mapping = {
            "student": "intern", "entry": "fresher", "junior": "junior",
            "mid": "middle", "senior": "senior", "senior_plus": "lead",
        }
        if stage in mapping:
            return mapping[stage], "giả định theo kinh nghiệm hiện tại"

        return self._level_from_years(years), \
            "giả định theo kinh nghiệm hiện tại"

    @staticmethod
    def _level_from_years(years: float) -> str:
        # Khớp khung của career_framework: fresher 0-1, junior 1-2.5,
        # middle 2.5-3.5, senior 3.5-5, lead 5+.
        if years < 1:
            return "fresher"
        if years < 2.5:
            return "junior"
        if years < 3.5:
            return "middle"
        if years < 5:
            return "senior"
        return "lead"

    def _check_level_fit(self, ctx) -> List[Dict[str, Any]]:
        out = []
        level = ctx["level"]
        t_idx = LEVEL_ORDER.index(level)

        if ctx["stage"] == "student" and ctx["years"] < 0.5:
            c_idx = 0
        else:
            c_idx = LEVEL_ORDER.index(self._level_from_years(ctx["years"]))

        if t_idx - c_idx >= 2:
            nxt = LEVEL_ORDER[c_idx + 1]
            out.append(self._s(
                "level_fit", "level_stretch", "high", "medium",
                f"Kinh nghiệm hiện tại ({ctx['years']:g} năm) tương đương "
                f"{LEVEL_ORDER[c_idx]}, nhưng bạn nhắm level "
                f"{ctx['policy']['label']}.",
                f"Cân nhắc nhắm level {nxt} trước. Nếu vẫn ứng tuyển "
                f"{level}, CV phải có bằng chứng đúng cấp độ (xem mục "
                f"level_evidence).",
            ))
        elif c_idx - t_idx >= 2:
            out.append(self._s(
                "level_fit", "level_overqualified", "low", "low",
                f"Kinh nghiệm ({ctx['years']:g} năm) vượt xa level "
                f"{ctx['policy']['label']}.",
                f"Cân nhắc ứng tuyển level cao hơn "
                f"({LEVEL_ORDER[min(c_idx, len(LEVEL_ORDER) - 1)]}); nếu "
                f"vẫn nhắm {level}, giải thích rõ lý do chuyển hướng.",
            ))

        # Level từ middle trở lên không nên dựa vào dự án học tập.
        if t_idx >= LEVEL_ORDER.index("middle"):
            academic = []
            for proj in ctx["profile"].get("projects") or []:
                if not isinstance(proj, dict):
                    continue
                blob = self._fold(" ".join(
                    [str(proj.get("name") or "")]
                    + [str(d) for d in proj.get("description") or []]
                ))
                if any(w in blob for w in ACADEMIC_PROJECT_WORDS):
                    academic.append(proj.get("name") or "?")
            if academic:
                out.append(self._s(
                    "projects", "academic_projects_for_level", "medium",
                    "low",
                    f"Level {ctx['policy']['label']} nhưng CV còn dự án "
                    f"mang tính học tập: {', '.join(academic)}.",
                    "Thay bằng hệ thống/sản phẩm thực tế đã vận hành, nêu "
                    "quy mô và tác động; bỏ đồ án/bài tập khóa học.",
                    items=academic,
                ))

        return out

    def _evidence_has(self, text: str, keyword: str) -> bool:
        if keyword.startswith("re:"):
            return re.search(keyword[3:], text, flags=re.IGNORECASE) is not None
        return self._ci._has_keyword(text, keyword)

    def _check_level_evidence(self, ctx) -> List[Dict[str, Any]]:
        items = LEVEL_EVIDENCE.get(ctx["level"], [])
        if not items:
            return []

        text = (
            ctx["candidate"]["evidence_text"]
            + "\n" + self._fold(ctx["summary_text"])
            + "\n" + ctx["candidate"].get("other_text", "")
        )
        has_any_text = bool(text.strip())

        missing = []
        for item in items:
            found = has_any_text and any(
                self._evidence_has(text, kw) for kw in item["kw"]
            )
            if not found:
                missing.append(item)

        if not missing:
            return []

        base = ctx["policy"]["evidence_priority"]
        priority = base
        if base == "high" and len(missing) < max(1, len(items) // 2):
            priority = "medium"

        return [self._s(
            "level_evidence", "level_evidence_missing", priority, "medium",
            f"CV chưa thể hiện bằng chứng đặc trưng của level "
            f"{ctx['policy']['label']}: "
            + ", ".join(m["label"] for m in missing) + ".",
            f"Nhà tuyển dụng đánh giá level {ctx['policy']['label']} qua "
            f"các bằng chứng này. Nếu bạn ĐÃ làm thật, hãy thêm bullet; "
            f"nếu chưa, đừng ghi.",
            items=[m["label"] for m in missing],
            prove={m["label"]: m["tmpl"] for m in missing},
        )]

    def _check_education_level(self, ctx) -> List[Dict[str, Any]]:
        """Nội dung học vấn theo level (không gợi ý bố cục/thứ tự mục)."""
        if not ctx["policy"]["gpa"]:
            return []

        education = ctx["profile"].get("education") or []
        has_gpa = any(
            isinstance(e, dict) and e.get("gpa") for e in education
        )

        if education and not has_gpa:
            return [self._s(
                "education", "education_gpa", "low", "low",
                "Mục Học vấn chưa có GPA/kết quả học tập.",
                "Nếu GPA tốt (≥ 3.0/4 hoặc ≥ 7.5/10), hãy ghi kèm môn học "
                "liên quan và học bổng/giải thưởng. Nếu không, bỏ qua và "
                "nhấn vào dự án.",
            )]

        return []

    def _check_expected_achievements(self, ctx) -> List[Dict[str, Any]]:
        level_req = ctx["requirements"].get("level_requirements")
        if not isinstance(level_req, dict):
            return []

        achievements = level_req.get("expected_achievements") or []
        if not achievements:
            return []

        return [self._s(
            "level_evidence", "expected_achievements_checklist", "medium",
            "medium",
            f"Thành tựu kỳ vọng của level {ctx['policy']['label']} theo "
            f"career framework: " + "; ".join(achievements) + ".",
            "Tự rà soát từng mục: nếu đã làm thật thì phải có ít nhất một "
            "bullet làm bằng chứng trong CV; nếu chưa, đặt làm mục tiêu "
            "kế tiếp.",
            items=list(achievements),
        )]

    # ================================================================
    # BULLETS (Experience + Projects)
    # ================================================================

    LABEL_PREFIX_RE = re.compile(
        r"^(?:responsibilit(?:y|ies)|duties|description|achievements?|"
        r"accomplishments?|highlights?|mô tả|trách nhiệm|nhiệm vụ|"
        r"thành tựu)\s*[:：\-–]\s*",
        re.IGNORECASE,
    )

    METRIC_SLOTS = 2

    def _iter_bullets(self, ctx):
        profile = ctx["profile"]

        for exp in profile.get("experience") or []:
            if not isinstance(exp, dict):
                continue
            label = " @ ".join(
                p for p in (exp.get("position"), exp.get("company")) if p
            ) or "Experience"
            has_tech = bool(exp.get("skills") or exp.get("technologies"))
            for text in exp.get("description") or []:
                yield "experience", label, str(text), has_tech

        for proj in profile.get("projects") or []:
            if not isinstance(proj, dict):
                continue
            label = proj.get("name") or "Project"
            has_tech = bool(proj.get("technologies"))
            for text in proj.get("description") or []:
                yield "projects", label, str(text), has_tech

    def _check_bullets(self, ctx):
        bullets = list(self._iter_bullets(ctx))
        if not bullets:
            return [], []

        skills_folded = [self._fold(s) for s in ctx["candidate"]["skills"]]

        analyzed = []
        for section, label, raw, has_tech in bullets:
            text = re.sub(r"^[\-•*\s]+", "", raw).strip()
            # Bỏ nhãn như "Responsibilities:" — không phải nội dung bullet.
            text = self.LABEL_PREFIX_RE.sub("", text).strip()
            if not text:
                continue
            issues = self._bullet_issues(text, skills_folded, has_tech)
            analyzed.append((section, label, text, issues))

        suggestions = []

        no_metric = sum(1 for a in analyzed if "no_metric" in a[3])
        weak = sum(1 for a in analyzed if "weak_verb" in a[3])
        total = len(analyzed)

        need_ratio = ctx["policy"]["metric_ratio"]
        if total and (total - no_metric) / total < need_ratio:
            suggestions.append(self._s(
                "bullets", "bullets_no_metrics",
                "high" if ctx["level"] in ("middle", "senior", "lead")
                else "medium", "medium",
                f"{no_metric}/{total} bullet chưa có số liệu/kết quả đo "
                f"được; level {ctx['policy']['label']} nên có số liệu ở "
                f"ít nhất {need_ratio:.0%} bullet.",
                "Chọn 1-2 bullet quan trọng nhất và thêm kết quả đo được "
                "(%, số người dùng, thời gian, số request...). Chỉ dùng "
                "số liệu có thật; không cần ép số liệu vào mọi bullet.",
                example=ctx["policy"]["metric_example"],
            ))

        if weak:
            suggestions.append(self._s(
                "bullets", "bullets_weak_verbs", "medium", "low",
                f"{weak}/{total} bullet mở đầu bằng cụm động từ yếu "
                f"(worked on, responsible for, tham gia, phụ trách...).",
                "Bắt đầu mỗi bullet bằng động từ hành động mạnh (Built, "
                "Designed, Optimized / Xây dựng, Thiết kế, Tối ưu).",
            ))

        # Chỉ liệt kê bullet có lỗi cấu trúc; số liệu chỉ gợi ý cho tối
        # đa METRIC_SLOTS bullet (tránh gắn "[kết quả]" vào mọi bullet).
        structural = [a for a in analyzed if set(a[3]) - {"no_metric"}]
        structural.sort(key=lambda a: -len(a[3]))
        metric_only = [a for a in analyzed if a[3] == ["no_metric"]]

        # Ưu tiên gợi ý số liệu cho bullet đã viết tốt (chỉ thiếu số
        # liệu), không phải bullet quá dài/động từ yếu.
        granted = set()
        for entry in metric_only + structural:
            if "no_metric" in entry[3] and len(granted) < self.METRIC_SLOTS:
                granted.add(id(entry))

        rewrites = []

        for entry in structural + metric_only:
            section, label, text, issues = entry
            if len(rewrites) >= self.MAX_BULLET_REWRITES:
                break

            want_metric = id(entry) in granted
            if issues == ["no_metric"] and not want_metric:
                continue

            draft = self._rewrite_draft(text, issues, want_metric)

            shown = [
                self._issue_text(i) for i in issues
                if i != "no_metric" or want_metric
            ]
            rewrites.append({
                "section": section,
                "source": label,
                "original": text,
                "issues": shown,
                "draft": draft if draft != text else None,
            })

        return suggestions, rewrites

    def _bullet_issues(
        self,
        text: str,
        skills_folded: List[str],
        has_item_tech: bool = False,
    ) -> List[str]:
        issues = []
        words = text.split()
        folded = self._fold(text)

        if len(words) < 6:
            issues.append("too_short")
        elif len(words) > 35:
            issues.append("too_long")

        if self._weak_phrase(folded):
            issues.append("weak_verb")
        elif not self._starts_with_strong_verb(folded):
            issues.append("no_action_verb")

        if not self._has_metric(text):
            issues.append("no_metric")

        # Dự án/công việc đã khai báo công nghệ riêng thì không đòi mỗi
        # bullet phải nhắc lại.
        if (
            not has_item_tech
            and skills_folded
            and not any(
                self._ci._has_keyword(folded, s) for s in skills_folded if s
            )
        ):
            issues.append("no_technology")

        return issues

    @staticmethod
    def _issue_text(code: str) -> str:
        return {
            "too_short": "Quá ngắn, thiếu ngữ cảnh.",
            "too_long": "Quá dài (>35 từ), nên tách thành 2 bullet.",
            "weak_verb": "Mở đầu bằng cụm động từ yếu.",
            "no_action_verb": "Chưa mở đầu bằng động từ hành động mạnh.",
            "no_metric": "Chưa có số liệu/kết quả đo được.",
            "no_technology": "Chưa nêu công nghệ đã dùng.",
        }.get(code, code)

    def _weak_phrase(self, folded: str) -> Optional[str]:
        for phrase in sorted(WEAK_PHRASES, key=len, reverse=True):
            if re.match(r"^" + re.escape(phrase) + r"(?!\w)", folded):
                return phrase
        return None

    @staticmethod
    def _starts_with_strong_verb(folded: str) -> bool:
        first = re.split(r"\s+", folded, maxsplit=1)[0] if folded else ""
        return first in STRONG_VERBS

    @staticmethod
    def _has_metric(text: str) -> bool:
        # Bỏ các token công nghệ có chữ số (Python3, OAuth2, ES6, Web3).
        stripped = re.sub(r"\b[A-Za-z]+\d+[A-Za-z]*\b", " ", text)
        stripped = re.sub(r"\b(?:v|ver|version)\s*\d+(?:\.\d+)*\b", " ",
                          stripped, flags=re.IGNORECASE)
        # Quy mô nhóm ("5-member team", "team of 4") không phải kết quả.
        stripped = re.sub(
            r"\b\d+[- ]?(?:member|person|people|người|thành viên)s?\b"
            r"(?:\s+team)?", " ", stripped, flags=re.IGNORECASE,
        )
        stripped = re.sub(r"\bteam\s+of\s+\d+\b", " ", stripped,
                          flags=re.IGNORECASE)
        return bool(re.search(r"\d", stripped))

    def _rewrite_draft(
        self,
        text: str,
        issues: List[str],
        want_metric: bool = False,
    ) -> str:
        """Bản nháp có placeholder — người dùng tự điền số liệu thật."""
        folded = self._fold(text)
        draft = text

        phrase = self._weak_phrase(folded)
        if phrase:
            replacement = WEAK_PHRASES[phrase].split(" / ")[0]
            draft = replacement + text[len(phrase):]

        elif "no_action_verb" in issues:
            vi = self._is_vietnamese(text)
            draft = ("[Động từ mạnh: Xây dựng/Tối ưu/Triển khai] "
                     if vi else
                     "[Strong verb: Built/Optimized/Deployed] ") + text

        vi = self._is_vietnamese(text)
        additions = []
        if "no_technology" in issues:
            additions.append("bằng [công nghệ]" if vi else "using [technology]")
        if want_metric:
            additions.append(
                "giúp [kết quả đo được: X%/N người dùng/thời gian]"
                if vi else
                "resulting in [measurable outcome: X% / N users / time]"
            )

        if additions:
            draft = draft.rstrip(" .") + ", " + ", ".join(additions) + "."

        return draft

    # ================================================================
    # KEYWORDS
    # ================================================================

    def _keyword_plan(self, ctx) -> Dict[str, List[str]]:
        add_if_true, learn_first, already = [], [], []

        for key in ("skill_analysis", "tool_analysis"):
            for item in (ctx["analysis"].get(key) or {}).get("items", []):
                if item["status"] == "matched":
                    already.append(
                        self._display_skill(
                            ctx["candidate"]["skills"],
                            item.get("matched_by") or item["name"],
                        )
                    )
                elif item["status"] == "partial" and item.get("via") in (
                    "evidence", "alternative"
                ):
                    add_if_true.append(item["name"])
                elif item["status"] == "missing":
                    learn_first.append(item["name"])

        return {
            "already_in_cv": self._uniq(already),
            "add_if_you_really_have_it": self._uniq(add_if_true),
            "learn_first_then_add": self._uniq(learn_first),
        }

    # ================================================================
    # FINALIZE / HEADLINE
    # ================================================================

    def _finalize(self, suggestions, ctx) -> List[Dict[str, Any]]:
        seen = set()
        unique = []
        for s in suggestions:
            key = (s["section"], s["type"])
            if key in seen:
                continue
            seen.add(key)
            unique.append(s)

        unique.sort(key=lambda s: (
            PRIORITY_ORDER[s["priority"]],
            -float(s.get("gain") or 0),
            EFFORT_ORDER[s["effort"]],
        ))

        for index, s in enumerate(unique, start=1):
            s["id"] = f"S{index:02d}"

        return unique

    def _headline(self, suggestions, ctx) -> str:
        high = [s for s in suggestions if s["priority"] == "high"]
        score = (ctx["analysis"].get("score") or {}).get("overall")

        if not suggestions:
            return "CV đã khớp tốt với yêu cầu; không có gợi ý đáng kể."

        prefix = f"[Level {ctx['policy']['label']}] "
        if score is not None:
            prefix += f"Điểm phù hợp {score:.0f}/100. "

        if high:
            sections = sorted({s["section"] for s in high})
            return (
                f"{prefix}Có {len(high)} việc ưu tiên cao cần sửa trước "
                f"(mục: {', '.join(sections)})."
            )

        return f"{prefix}Không có lỗi nghiêm trọng; còn {len(suggestions)} " \
               f"điểm có thể cải thiện thêm."

    # ================================================================
    # HELPERS
    # ================================================================

    @staticmethod
    def _s(
        section: str,
        type_: str,
        priority: str,
        effort: str,
        issue: str,
        suggestion: str,
        example: str = "",
        items: Optional[List[str]] = None,
        prove: Optional[Dict[str, str]] = None,
        gain: float = 0,
    ) -> Dict[str, Any]:
        item = {
            "id": "",
            "section": section,
            "type": type_,
            "priority": priority,
            "effort": effort,
            "issue": issue,
            "suggestion": suggestion,
            "gain": gain,
        }
        if example:
            item["example"] = example
        if items:
            item["items"] = list(items)
        if prove:
            item["how_to_prove"] = dict(prove)
        return item

    @staticmethod
    def _fold(value: Any) -> str:
        return " ".join(
            unicodedata.normalize("NFC", str(value or "")).strip()
            .casefold().split()
        )

    def _mentions(self, text: str, phrase: str) -> bool:
        return self._ci._has_keyword(self._fold(text), self._fold(phrase))

    @staticmethod
    def _is_vietnamese(text: str) -> bool:
        return CareerIntelligence._is_vietnamese(text)

    def _display_skill(self, skills: List[str], concrete: str) -> str:
        """Tìm tên hiển thị gốc trong danh sách skill của ứng viên."""
        key = self._fold(concrete)
        for skill in skills:
            if self._fold(skill) == key:
                return skill
        for skill in skills:
            if self._ci._has_keyword(self._fold(skill), key):
                return skill
        return concrete

    @staticmethod
    def _uniq(items: List[str]) -> List[str]:
        seen, result = set(), []
        for item in items:
            key = str(item).casefold()
            if key not in seen:
                seen.add(key)
                result.append(item)
        return result


# ====================================================================
# FUNCTION API
# ====================================================================

def advise_cv(
    candidate_profile: Dict[str, Any],
    requirements: Dict[str, Any],
    analysis: Dict[str, Any],
) -> Dict[str, Any]:
    """Tạo gợi ý chỉnh sửa CV (xem CVAdvisor.advise)."""
    return CVAdvisor().advise(candidate_profile, requirements, analysis)


def format_report(advice: Dict[str, Any]) -> str:
    """Định dạng gợi ý thành văn bản dễ đọc trên console."""
    icon = {"high": "[CAO]", "medium": "[TRUNG BÌNH]", "low": "[THẤP]"}
    effort = {"low": "sửa nhanh", "medium": "cần viết thêm",
              "high": "cần học/làm thêm"}

    lines = ["", "===== GỢI Ý CHỈNH SỬA CV =====", advice.get("headline", "")]

    guide = advice.get("level_guide") or {}
    if guide:
        lines.append(
            f"Level mục tiêu: {guide.get('label')} "
            f"({advice.get('level_source')})"
        )

    for note in advice.get("notes", []):
        lines.append(f"  (lưu ý) {note}")

    quick = advice.get("quick_wins") or []
    if quick:
        lines += ["", "--- Làm ngay (nhanh, hiệu quả) ---"]
        for s in quick:
            lines.append(f"  {s['id']}: {s['issue']}")

    lines += ["", "--- Chi tiết theo mức ưu tiên ---"]
    for s in advice.get("suggestions", []):
        lines.append(
            f"\n{s['id']} {icon[s['priority']]} [{s['section']}] "
            f"({effort[s['effort']]})"
        )
        lines.append(f"  Vấn đề : {s['issue']}")
        lines.append(f"  Gợi ý  : {s['suggestion']}")
        if s.get("example"):
            lines.append(f"  Mẫu    : {s['example']}")
        for name, hint in (s.get("how_to_prove") or {}).items():
            lines.append(f"  - {name}: {hint}")

    rewrites = advice.get("bullet_rewrites") or []
    if rewrites:
        lines += ["", "--- Bản nháp viết lại bullet (điền số liệu THẬT) ---"]
        for r in rewrites:
            lines.append(f"\n  [{r['section']}] {r['source']}")
            lines.append(f"  Gốc  : {r['original']}")
            lines.append(f"  Vấn đề: {' '.join(r['issues'])}")
            if r.get("draft"):
                lines.append(f"  Nháp : {r['draft']}")

    kw = advice.get("keywords") or {}
    if any(kw.values()):
        lines += ["", "--- Từ khóa (ATS) ---"]
        labels = (
            ("already_in_cv", "Đã có trong CV"),
            ("add_if_you_really_have_it", "Thêm nếu bạn thực sự có"),
            ("learn_first_then_add", "Học trước rồi mới thêm"),
        )
        for key, label in labels:
            if kw.get(key):
                lines.append(f"  {label}: {', '.join(kw[key])}")

    stats = advice.get("stats", {})
    lines += [
        "",
        f"Tổng {stats.get('total', 0)} gợi ý "
        f"(cao {stats.get('high', 0)}, trung bình "
        f"{stats.get('medium', 0)}, thấp {stats.get('low', 0)}).",
    ]

    return "\n".join(lines)
