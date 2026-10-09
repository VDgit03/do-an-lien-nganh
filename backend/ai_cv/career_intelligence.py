"""
career_intelligence.py  (bản đã sửa lỗi logic)

Đánh giá mức độ phù hợp của Candidate Profile với một bộ yêu cầu.

Đầu vào:
    1. Candidate Profile
    2. Requirements Profile
       - Generic JD Profile từ jd_profile.py
       - Career Framework Profile từ career_framework.py

Nhiệm vụ duy nhất:
    - Đối chiếu
    - Chấm điểm
    - Phân tích gap
    - Đưa ra mức độ ưu tiên cải thiện

Các lỗi logic đã sửa so với bản cũ (xem README_FIXES.md):
    1. Level/Role không hợp lệ -> trước đây trả điểm 100/100 giả; nay raise ValueError.
    2. Điểm tổng KHÔNG còn được "tặng" 100 cho nhóm không có yêu cầu
       (trọng số được chuẩn hóa lại chỉ trên các nhóm có yêu cầu thật).
    3. Responsibilities của career framework nằm trong level_requirements
       nhưng trước đây bị bỏ qua (luôn 100).
    4. Soft skill trước đây luôn 0 vì profile ứng viên không có soft skill;
       nay suy ra từ bằng chứng trong CV (song ngữ Việt/Anh).
    5. Yêu cầu trừu tượng ("Database", "Một ngôn ngữ backend", "Testing"...)
       được ánh xạ sang công nghệ cụ thể / bằng chứng trong mô tả.
    6. "A hoặc B" được coi là MỘT yêu cầu (đáp ứng một trong hai).
    7. So khớp chuỗi con an toàn hơn: "React" != "React Native", "C" != "C++".
    8. Đồng nghĩa Việt/Anh cho học vấn, ngoại ngữ ("Đại học" ~ "Bachelor").
    9. Status "not_required" (min = 0 năm) khớp với main.py và không được tính điểm.
   10. Chuẩn hóa Unicode NFC (PDF tiếng Việt hay ở dạng NFD làm so khớp hỏng).

Module này KHÔNG:
    - đọc PDF
    - xử lý NLP
    - xử lý JD
    - xây career framework
"""

import re
import unicodedata
from functools import lru_cache
from typing import Any, Dict, List, Optional

VALID_LEVELS_HINT = "intern, fresher, junior, middle, senior, lead"

VIETNAMESE_CHARS = set(
    "ăâđêôơưàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡ"
    "ùúụủũừứựửữỳýỵỷỹ"
)


# --------------------------------------------------------------------
# RESPONSIBILITIES của career framework (viết tiếng Việt) -> từ khóa song
# ngữ Việt/Anh. Nhờ đó CV tiếng Anh vẫn được đối chiếu thay vì bị bỏ qua.
# Từ khóa cố ý chặt (tránh "manag*", "review*" trần) để "HR management
# system" không bị coi là bằng chứng quản lý nhóm.
# --------------------------------------------------------------------

_GENERIC_WORK = [
    "implement*", "built", "build", "develop*", "completed", "delivered",
    "created", "designed", "xây dựng", "phát triển", "triển khai",
    "hoàn thành", "thực hiện",
]
_BUG_WORK = [
    "bug*", "fix*", "debug*", "defect*", "troubleshoot*", "root cause",
    "diagnos*", "sửa lỗi",
]
_CODE_REVIEW = [
    "code review*", "peer review*", "pull request*", "pr review*",
    r"re:review\w*\s+(?:\w+\s+){0,2}(?:code|pr|pull)",
]
_RISK = ["risk*", "mitigat*", "contingency", "rủi ro"]
_MENTOR = [
    "mentor*", "coach*", "onboard*", "hướng dẫn", "đào tạo",
    r"re:train\w*\s+(?:\w+\s+){0,2}members",
]
_UI_WORK = [
    "ui", "user interface*", "interface*", "frontend", "html", "css",
    "responsive", "bootstrap", "react", "vue.js", "angular", "thymeleaf",
    "giao diện",
]
_LEAD = [
    "led", r"re:lead(?:ing)?\s+(?:a\s+|the\s+)?(?:\w+\s+)?team",
    "team lead", "technical lead*", "president", "captain",
    "quản lý nhóm", "chủ tịch", "dẫn dắt",
]
_ARCH = [
    "architect*", "system design", "technical direction", "roadmap",
    "kiến trúc", "định hướng kỹ thuật",
]
_STANDARD = [
    "standard*", "convention*", "guideline*", "best practice*", "linter",
    "eslint", "code style", "tiêu chuẩn", "quy chuẩn", "quy trình",
]
_COLLAB_TEAM = [
    r"re:work(?:ed|ing)?\s+with\s+(?:\w+\s+){0,2}(?:team|office|"
    r"department)s?", "cross-team", "cross-functional", "collaborat*",
    "coordinat*", "phối hợp", "hợp tác",
]

RESPONSIBILITY_KEYWORDS_RAW: Dict[str, List[str]] = {
    "Chuyển thiết kế thành giao diện": [
        "figma", "mockup*", "wireframe*", "pixel-perfect",
    ] + _UI_WORK,
    "Cải thiện hiệu năng giao diện": [
        "performance", "optimiz*", "lighthouse", "lazy load*", "bundle",
        "core web vitals", "hiệu năng", "tối ưu",
    ],
    "Ghi nhận và sửa lỗi cơ bản": _BUG_WORK,
    "Hoàn thành nhiệm vụ được hướng dẫn": _GENERIC_WORK,
    "Hỗ trợ phát triển đội ngũ": _MENTOR + ["knowledge sharing",
                                             "chia sẻ kiến thức"],
    "Hỗ trợ quyết định cấp sản phẩm": [
        "product decision*", "product manager", "product owner",
        "roadmap", "prioriti*", "stakeholder*", "requirement*",
        "trade-off*", "yêu cầu",
    ],
    "Hỗ trợ thành viên junior": _MENTOR + _CODE_REVIEW + ["junior*"],
    "Phát triển tính năng giao diện": [
        "feature*", "component*", "page*", "screen*", "dashboard*",
        "tính năng",
    ] + _UI_WORK,
    "Phát triển tính năng độc lập": [
        "feature*", "module*", "endpoint*", "api", "tính năng",
        "chức năng",
    ] + _GENERIC_WORK,
    "Phân bổ công việc": [
        "assign*", "delegat*", "allocat*", "sprint planning", "backlog",
        "jira", "phân công", "phân bổ",
        r"re:manag\w+\s+(?:\w+\s+){0,2}tasks?",
    ],
    "Phân tích và sửa lỗi": _BUG_WORK + ["analyz*", "analys*"],
    "Phối hợp với các bên liên quan": [
        "stakeholder*", "product manager", "client*", "customer*",
        "đối tác", "khách hàng", "bên liên quan",
    ] + _COLLAB_TEAM,
    "Phối hợp với các nhóm khác": _COLLAB_TEAM,
    "Phối hợp với thành viên khác": [
        "team", "teammate*", "member*", "pair programming", "nhóm",
    ] + _COLLAB_TEAM,
    "Quản lý rủi ro": _RISK,
    "Review code": _CODE_REVIEW,
    "Review code đơn giản": _CODE_REVIEW,
    "Review công việc": _CODE_REVIEW + ["kiểm tra chéo"],
    "Sửa lỗi cơ bản": _BUG_WORK,
    "Sửa lỗi giao diện cơ bản": _BUG_WORK + ["ui", "css", "responsive"],
    "Sửa lỗi và cải thiện UI": _BUG_WORK + ["ui", "ux", "improv*"],
    "Thiết kế giải pháp": [
        "design*", "architect*", "solution*", "system design", "thiết kế",
        "giải pháp",
    ],
    "Thiết kế kiến trúc frontend": [
        "architect*", "component library", "state management",
        "design system*", "micro-frontend*", "monorepo", "kiến trúc",
    ],
    "Thiết lập tiêu chuẩn": _STANDARD,
    "Thiết lập tiêu chuẩn kỹ thuật": _STANDARD + [
        "engineering standard*", "coding standard*",
    ],
    "Thực hiện công việc độc lập": [
        "independent*", "ownership", "owned", "end-to-end", "autonomous*",
        "personal project*", "solo", "độc lập",
    ],
    "Thực hiện dự án học tập": [
        "project*", "capstone", "coursework", "thesis", "hackathon",
        "đồ án", "bài tập lớn", "dự án",
    ],
    "Thực hiện nhiệm vụ được giao": _GENERIC_WORK,
    "Tích hợp API": [
        "api", "rest*", "graphql", "axios", "integrat*", "tích hợp",
        "webhook*", "third-party",
    ],
    "Viết code theo coding convention": [
        "convention*", "linter", "eslint", "prettier", "code style",
        "clean code", "checkstyle", "pep8", "clean architecture",
        "best practice*", "coding standard*",
    ],
    "Viết tài liệu và báo cáo": [
        "documentation", "readme", "swagger", "openapi", "confluence",
        "wiki", "technical writing", "tài liệu", "báo cáo",
        r"re:document(?:ed|ing)\b",
        r"re:(?:write|wrote|writing|prepared?)\s+(?:\w+\s+){0,2}reports?",
    ],
    "Xây dựng giao diện đơn giản": [
        "landing page", "jquery",
    ] + _UI_WORK,
    "Đánh giá giải pháp": [
        "evaluat*", "trade-off*", "compar*", "benchmark*", "assess*",
        "proof of concept", "đánh giá", "so sánh",
    ],
    "Đánh giá rủi ro": _RISK,
    "Đưa ra quyết định kỹ thuật": [
        "decision*", "trade-off*", "chose", "selecting", "evaluat*",
        "quyết định", "lựa chọn",
        r"re:select\w*\s+(?:\w+\s+){0,2}(?:framework|library|technology|"
        r"database|tool)",
    ],
    "Định hướng kiến trúc": _ARCH,
    "Định hướng kỹ thuật": _ARCH + [
        "tech strategy", "strateg*", "technical lead*", "standard*",
    ],
    "Định hướng kỹ thuật cho nhóm": _LEAD + _ARCH + ["guid*", "mentor*"],
    "Định hướng nhóm": _LEAD + ["vision", "roadmap", "định hướng"],
}


def _fold_key(value: str) -> str:
    return " ".join(
        unicodedata.normalize("NFC", str(value or "")).casefold().split()
    )


RESPONSIBILITY_KEYWORDS: Dict[str, List[str]] = {
    _fold_key(k): v for k, v in RESPONSIBILITY_KEYWORDS_RAW.items()
}


class CareerIntelligence:
    """So sánh Candidate Profile với JD Profile hoặc Career Framework."""

    # Một số tên gọi khác nhau của cùng một công nghệ/kỹ năng.
    ALIAS_MAP = {
        "reactjs": "react",
        "react.js": "react",
        "nodejs": "node.js",
        "node js": "node.js",
        "vuejs": "vue.js",
        "vue js": "vue.js",
        "vue": "vue.js",
        "nextjs": "next.js",
        "postgres": "postgresql",
        "mongo": "mongodb",
        "csharp": "c#",
        "c sharp": "c#",
        "golang": "go",
        "k8s": "kubernetes",
        "ci cd": "ci/cd",
        "cicd": "ci/cd",
        "js": "javascript",
        "ts": "typescript",
    }

    # Nhóm đồng nghĩa Việt/Anh (dùng khi đối chiếu học vấn, ngoại ngữ).
    EQUIVALENT_GROUPS = [
        {"bachelor", "đại học", "cử nhân", "kỹ sư", "undergraduate"},
        {"college", "cao đẳng"},
        {"master", "thạc sĩ", "thạc sỹ"},
        {"phd", "doctorate", "tiến sĩ", "tiến sỹ"},
        {"english", "tiếng anh"},
        {"japanese", "tiếng nhật"},
        {"korean", "tiếng hàn"},
        {"chinese", "tiếng trung"},
        {"french", "tiếng pháp"},
        {"german", "tiếng đức"},
    ]

    # Cặp KHÔNG tương đương: phrase `a` không được khớp bên trong `b`.
    NON_EQUIVALENT = [
        ("react", "react native"),
        ("c", "c++"),
        ("c", "c#"),
        ("sql", "nosql"),
        ("java", "javascript"),
    ]

    # Yêu cầu trừu tượng -> từ khóa công nghệ/bằng chứng cụ thể.
    # Hậu tố "*" = khớp tiền tố (optimiz* -> optimize/optimization).
    _BACKEND_LANGS = [
        "python", "java", "node.js", "go", "c#", "php", "ruby",
        "kotlin", "scala", "rust", "c++", ".net",
    ]
    _SQL_DBS = [
        "mysql", "postgresql", "sql server", "oracle", "sqlite",
        "mariadb", "sql",
    ]
    _ALL_DBS = _SQL_DBS + [
        "mongodb", "redis", "dynamodb", "firebase", "cassandra", "nosql",
    ]
    _FRONT_FRAMEWORKS = [
        "react", "vue.js", "angular", "next.js", "nuxt", "svelte",
    ]

    CONCEPT_MAP: Dict[str, List[str]] = {
        "một ngôn ngữ backend": _BACKEND_LANGS,
        "backend language": _BACKEND_LANGS,
        "database": _ALL_DBS,
        "databases": _ALL_DBS,
        "sql": _SQL_DBS,
        "database design": [
            "database design", "erd", "er diagram", "schema design",
            "normalization", "data model*", "database table*",
            "table design", "foreign key*", "relational model*",
            r"re:design\w*\s+(?:\w+\s+){0,3}(?:database|db|schema|tables?)",
            r"re:thiết kế\s+(?:\w+\s+){0,3}(?:cơ sở dữ liệu|csdl|database|bảng)",
        ],
        "data modeling": ["data model*", "erd", "schema design"],
        "authentication": [
            "authentication", "jwt", "oauth", "oauth2", "sso", "keycloak",
            "passport",
        ],
        "api design": [
            "api design", "rest api", "restful", "graphql", "grpc",
            "openapi", "swagger",
        ],
        "api integration": [
            "api integration", "rest api", "restful", "graphql", "axios",
            "third-party api",
        ],
        "rest api integration": [
            "rest api", "restful", "graphql", "axios", "api integration",
        ],
        "rest api": ["rest api", "restful"],
        "error handling": [
            "error handling", "exception handling", "logging",
        ],
        "testing": [
            "testing", "unit test*", "pytest", "junit", "jest", "mocha",
            "selenium", "cypress", "postman", "test case*", "tdd",
        ],
        "basic testing": [
            "testing", "unit test*", "pytest", "junit", "jest", "mocha",
            "cypress",
        ],
        "functional testing": [
            "functional test*", "manual test*", "test case*", "selenium",
            "cypress",
        ],
        "api testing": ["postman", "api test*", "rest assured", "swagger"],
        "automation testing": [
            "selenium", "cypress", "playwright", "appium", "automation test*",
        ],
        "caching": ["caching", "cache", "redis", "memcached"],
        # "authentication" đã tính cho yêu cầu Authentication; không tính
        # lại cho Security để tránh một câu CV được chấm hai lần.
        "security": [
            "security", "owasp", "encryption", "hashing", "csrf", "xss",
            "sql injection", "rbac", "role-based access", "authoriz*",
        ],
        "security fundamentals": [
            "security", "owasp", "encryption", "hashing", "csrf", "xss",
            "sql injection", "rbac", "role-based access", "authoriz*",
        ],
        "containerization": ["docker", "kubernetes", "container*", "podman"],
        "ci/cd": [
            "ci/cd", "github actions", "gitlab ci", "jenkins", "circleci",
            "azure devops", "travis",
        ],
        "ci basics": [
            "ci/cd", "github actions", "gitlab ci", "jenkins", "circleci",
        ],
        "cloud platforms": ["aws", "azure", "gcp", "google cloud"],
        "cloud platforms (aws/azure/gcp)": [
            "aws", "azure", "gcp", "google cloud",
        ],
        "infrastructure as code": [
            "terraform", "ansible", "cloudformation", "pulumi",
            "infrastructure as code",
        ],
        "monitoring": [
            "prometheus", "grafana", "datadog", "elk", "cloudwatch",
            "monitoring", "new relic",
        ],
        "observability": [
            "prometheus", "grafana", "datadog", "elk", "opentelemetry",
        ],
        "package managers": [
            "npm", "yarn", "pnpm", "pip", "maven", "gradle", "nuget",
            "composer",
        ],
        "react hoặc vue": _FRONT_FRAMEWORKS,
        "react hoặc framework tương đương": _FRONT_FRAMEWORKS,
        "framework tương đương": _FRONT_FRAMEWORKS,
        "equivalent framework": _FRONT_FRAMEWORKS,
        "state management": [
            "redux", "zustand", "mobx", "vuex", "pinia", "ngrx",
            "context api", "state management",
        ],
        "state management cơ bản": [
            "redux", "zustand", "mobx", "vuex", "pinia", "context api",
            "state management",
        ],
        "responsive design": [
            "responsive", "bootstrap", "tailwind", "media quer*", "flexbox",
            "css grid", "mobile-first",
        ],
        "component-based development": _FRONT_FRAMEWORKS + ["component*"],
        "reusable components": ["component*", "storybook", "design system*"],
        "git": ["git", "github", "gitlab", "bitbucket"],
        "git workflows": ["git", "gitflow", "github", "gitlab"],
        "browser devtools": ["devtools", "chrome devtools", "lighthouse"],
        "machine learning": [
            "machine learning", "scikit-learn", "sklearn", "tensorflow",
            "pytorch", "keras", "xgboost",
        ],
        "data visualization": [
            "tableau", "power bi", "matplotlib", "seaborn", "plotly", "d3",
            "looker", "data visualization",
        ],
        "data pipelines": ["airflow", "etl", "spark", "kafka", "dbt"],
        "etl": ["etl", "airflow", "spark", "dbt", "ssis", "talend"],
        "linux": ["linux", "ubuntu", "centos", "debian"],
        "shell scripting": ["bash", "shell", "powershell", "zsh"],
        "networking": [
            "tcp/ip", "dns", "vpn", "cisco", "networking", "routing",
            "switching",
        ],
        "mobile programming": [
            "flutter", "react native", "kotlin", "swift", "android", "ios",
            "dart",
        ],
        "wireframing": ["figma", "wireframe*", "balsamiq", "sketch", "adobe xd"],
        "prototyping": ["figma", "prototype*", "adobe xd", "invision"],
        "visual design": ["figma", "photoshop", "illustrator", "sketch"],
        "performance optimization": [
            "performance", "optimiz*", "lighthouse", "profiling", "caching",
        ],
        "performance": ["performance", "optimiz*", "profiling"],
        "documentation": [
            "documentation", "readme", "swagger", "confluence",
            "technical writing",
        ],
        "requirement gathering": [
            "requirement*", "user stor*", "brd", "srs", "stakeholder*",
        ],
        "communication": ["communicat*", "presentation*", "present*"],
    }

    # Soft skill (song ngữ). Khóa = tên chuẩn.
    SOFT_SKILL_LEXICON: Dict[str, List[str]] = {
        "teamwork": [
            "teamwork", "team work", "collaborat*", "cooperat*",
            "team member*", "team of", "cross-functional",
            "làm việc nhóm", "làm việc theo nhóm", "phối hợp", "hợp tác",
            "team player", "teammate*",
            r"re:\d+[- ]?(?:member|person|people)s?\s+team",
            r"re:work(?:ed|ing)?\s+in\s+an?\s+(?:\w+[- ]){0,2}team",
        ],
        "communication": [
            "communicat*", "presentation*",
            r"re:\bpresent(?:ed|ing)\b", "giao tiếp",
            "thuyết trình", "trình bày", "truyền đạt", "liaison",
            r"re:organi[sz]\w*\s+(?:\w+\s+){0,2}events?",
            "tổ chức sự kiện",
        ],
        "problem solving": [
            "problem solving", "problem-solving", "troubleshoot*",
            "debug*", "root cause", "giải quyết vấn đề", "xử lý sự cố",
        ],
        "self learning": [
            "self-learn*", "self learn*", "self-study", "fast learner",
            "quick learner", "tự học", "tự nghiên cứu",
        ],
        "time management": [
            "time management", "deadline*", "prioriti*", "on time",
            "quản lý thời gian", "đúng hạn",
        ],
        "leadership": [
            "leader", "leadership", "team lead", "led a team", "led team",
            "lead a team", "leading", "mentor*", "coach*", "lãnh đạo",
            "dẫn dắt", "quản lý nhóm", "president", "captain",
            "chủ tịch", "chủ nhiệm", "trưởng nhóm", "trưởng câu lạc bộ",
        ],
        "proactive": [
            "proactive*", "initiative", "self-motivated", "chủ động",
            "tự giác",
        ],
        "critical thinking": [
            "critical thinking", "analytical", "logical thinking",
            "tư duy phản biện", "tư duy logic", "tư duy hệ thống",
        ],
        "adaptability": [
            "adaptab*", "flexib*", "thích nghi", "linh hoạt",
        ],
        "knowledge sharing": [
            "knowledge sharing", "onboard*", "training session*",
            "chia sẻ kiến thức", "truyền đạt kiến thức",
            r"re:train\w*\s+(?:\w+\s+){0,2}members",
        ],
        "orientation": [
            "roadmap", "vision", "strategy", "định hướng", "chiến lược",
        ],
        "decision making": [
            "decision*", "trade-off*", "tradeoff*", "ra quyết định",
            "quyết định", "đánh đổi", "lựa chọn giải pháp",
            r"re:evaluat\w+\s+(?:\w+\s+){0,2}(?:options|alternatives|approaches)",
        ],
        "conflict management": [
            "conflict*", "mediat*", "dispute*", "quản lý xung đột",
            "giải quyết xung đột", "hòa giải",
        ],
        "negotiation": [
            "negotiat*", "đàm phán", "thương lượng",
        ],
    }

    DEFAULT_WEIGHTS = {
        "skill": 0.35,
        "soft_skill": 0.15,
        "tool": 0.10,
        "language": 0.05,
        "experience": 0.15,
        "education": 0.10,
        "certification": 0.05,
        "responsibility": 0.05,
    }

    # =========================================================
    # PUBLIC API
    # =========================================================

    def analyze(
        self,
        candidate_profile: Dict[str, Any],
        requirements: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Phân tích Candidate Profile với JD/Framework.

        Raises:
            ValueError: input sai kiểu, level framework không hợp lệ,
                        hoặc không có yêu cầu nào để đối chiếu.
        """
        if not isinstance(candidate_profile, dict):
            raise ValueError("candidate_profile phải là dict.")

        if not isinstance(requirements, dict):
            raise ValueError("requirements phải là dict.")

        self._validate_requirements(requirements)

        warnings: List[str] = []

        requirement_items = self._normalize_requirements(requirements)
        if not requirement_items:
            raise ValueError(
                "Không có yêu cầu nào để đối chiếu (JD/framework rỗng)."
            )

        candidate = self._normalize_candidate(candidate_profile)

        if not candidate["skills"]:
            warnings.append(
                "Không trích xuất được kỹ năng nào từ CV; hãy kiểm tra file "
                "PDF (có phải bản scan?) và mục Skills."
            )

        # ---- so khớp từng nhóm -------------------------------------
        analyses = {
            "skill": self._compare_category(
                requirement_items, candidate, "skill"
            ),
            "soft_skill": self._compare_category(
                requirement_items, candidate, "soft_skill"
            ),
            "tool": self._compare_category(
                requirement_items, candidate, "tool"
            ),
            "language": self._compare_category(
                requirement_items, candidate, "language"
            ),
            "education": self._compare_category(
                requirement_items, candidate, "education"
            ),
            "certification": self._compare_category(
                requirement_items, candidate, "certification"
            ),
        }

        experience_analysis = self._compare_experience(
            requirement_items, candidate["experience_years"]
        )

        responsibilities = self._get_responsibilities(requirements)
        responsibility_analysis = self._compare_responsibilities(
            responsibilities,
            candidate["experience"],
            candidate["projects"],
            # Có mục Projects tự nó là bằng chứng làm dự án (tiêu đề mục
            # như "Personal Project" không nằm trong mô tả bullet).
            evidence_text=(
                candidate["evidence_text"] + "\n" + candidate["other_text"]
                + ("\nproject" if candidate["projects"] else "")
            ),
        )
        if responsibility_analysis.get("skipped_reason"):
            warnings.append(responsibility_analysis["skipped_reason"])

        if experience_analysis.get("over_qualified"):
            warnings.append(
                "Số năm kinh nghiệm của ứng viên vượt khung của level này; "
                "cân nhắc ứng tuyển level cao hơn."
            )

        # ---- điểm số ------------------------------------------------
        category_scores = {
            key: self._score(analysis) for key, analysis in analyses.items()
        }
        category_scores["experience"] = experience_analysis["score"]
        category_scores["responsibility"] = responsibility_analysis["score"]

        # Chỉ các nhóm THỰC SỰ có yêu cầu mới được tính vào điểm tổng.
        active = {
            key for key, analysis in analyses.items()
            if analysis["required"]
        }
        if experience_analysis["status"] in (
            "meets", "below_requirement", "above_range"
        ):
            active.add("experience")
        if responsibility_analysis["active"]:
            active.add("responsibility")

        overall, weights_used = self._weighted_score(category_scores, active)

        if not active:
            warnings.append(
                "Không có nhóm yêu cầu nào đủ điều kiện chấm điểm."
            )

        preferred_analysis = self._compare_preferred(
            requirements, candidate
        )

        gaps = self._build_gaps(analyses, experience_analysis,
                                responsibility_analysis)

        priorities = self._build_priorities(
            category_scores, gaps, active
        )

        return {
            "target": {
                "type": requirements.get(
                    "type",
                    "career_framework"
                    if "level_requirements" in requirements
                    else "",
                ),
                "role": (
                    requirements.get("title")
                    or requirements.get("role")
                    or ""
                ),
                "level": (
                    requirements.get("level")
                    or requirements.get("selected_level")
                    or ""
                ),
                "source": self._get_source(requirements),
            },
            "score": {
                "overall": overall,
                "components": {
                    key: round(value, 2)
                    for key, value in category_scores.items()
                },
                "weights_used": weights_used,
                "active_components": sorted(active),
            },
            "skill_analysis": analyses["skill"],
            "soft_skill_analysis": analyses["soft_skill"],
            "tool_analysis": analyses["tool"],
            "language_analysis": analyses["language"],
            "experience_analysis": experience_analysis,
            "education_analysis": analyses["education"],
            "certification_analysis": analyses["certification"],
            "responsibility_analysis": responsibility_analysis,
            "preferred_analysis": preferred_analysis,
            "warnings": warnings,
            "gaps": gaps,
            "priorities": priorities,
            "analysis": self._build_summary(overall, gaps, priorities),
        }

    # =========================================================
    # VALIDATION / REQUIREMENTS
    # =========================================================

    @staticmethod
    def _validate_requirements(requirements: Dict[str, Any]) -> None:
        is_framework = (
            "level_requirements" in requirements
            or requirements.get("type") == "career_framework"
        )

        if not is_framework:
            return

        level_requirements = requirements.get("level_requirements")

        if (
            not isinstance(level_requirements, dict)
            or requirements.get("level_recognized") is False
        ):
            raise ValueError(
                "Level không hợp lệ hoặc chưa được chọn cho career "
                f"framework. Level hợp lệ: {VALID_LEVELS_HINT}."
            )

    def _normalize_requirements(
        self,
        requirements: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        """Đưa JD Profile / Career Framework về cùng danh sách item."""

        # CASE 1: JOB DESCRIPTION
        if requirements.get("type") == "job_description":
            items = requirements.get("requirements", [])

            if isinstance(items, list):
                return [item for item in items if isinstance(item, dict)]

            return []

        # CASE 2: CAREER FRAMEWORK
        if "level_requirements" in requirements:
            level_requirements = requirements.get("level_requirements")

            if not isinstance(level_requirements, dict):
                return []

            items = []

            for key, category in (
                ("core_skills", "skill"),
                ("technical_skills", "skill"),
                ("soft_skills", "soft_skill"),
                ("tools", "tool"),
            ):
                for name in self._to_list(level_requirements.get(key)):
                    items.append({"category": category, "name": name})

            experience = level_requirements.get("typical_experience_years")

            if isinstance(experience, dict):
                items.append({
                    "category": "experience",
                    "name": "Professional Experience",
                    "minimum_years": experience.get("min"),
                    "maximum_years": experience.get("max"),
                })

            return items

        return []

    @staticmethod
    def _get_responsibilities(requirements: Dict[str, Any]) -> List[str]:
        """JD: top-level; Framework: nằm trong level_requirements."""
        value = requirements.get("responsibilities")

        if not value:
            level_requirements = requirements.get("level_requirements")
            if isinstance(level_requirements, dict):
                value = level_requirements.get("responsibilities")

        if not isinstance(value, list):
            return []

        return [str(v).strip() for v in value if str(v).strip()]

    # =========================================================
    # CATEGORY COMPARISON
    # =========================================================

    def _compare_category(
        self,
        requirements: List[Dict[str, Any]],
        candidate: Dict[str, Any],
        category: str,
    ) -> Dict[str, Any]:
        required = [
            item for item in requirements
            if str(item.get("category", "")).strip().lower() == category
            and str(item.get("name", "")).strip()
        ]

        matched, partial, missing, details = [], [], [], []

        for item in required:
            name = str(item.get("name", "")).strip()
            result = self._evaluate_requirement(item, category, candidate)

            if result["status"] == "matched":
                matched.append(name)
            elif result["status"] == "partial":
                partial.append(name)
            else:
                missing.append(name)

            details.append({
                "name": name,
                "status": result["status"],
                "via": result["via"],
                "matched_by": result["matched_by"],
                "importance": item.get("importance", "must_have"),
            })

        return {
            "required": [str(i.get("name", "")).strip() for i in required],
            "matched": matched,
            "partial": partial,
            "missing": missing,
            "items": details,
        }

    def _evaluate_requirement(
        self,
        item: Dict[str, Any],
        category: str,
        candidate: Dict[str, Any],
    ) -> Dict[str, Any]:
        name = str(item.get("name", "")).strip()
        options = self._split_options(name)

        if category == "soft_skill":
            return self._evaluate_soft_skill(name, candidate)

        pool = candidate["pools"].get(category, [])

        # 1) Khớp trực tiếp với một trong các lựa chọn ("A hoặc B").
        for option in options:
            target = self._normalize_text(option)
            if self._contains_match(target, pool):
                return self._result("matched", "direct", option)

        # 2) Alternatives khai báo trong JD -> chỉ đạt một phần.
        alternatives = item.get("alternatives", [])
        if isinstance(alternatives, list):
            for alternative in alternatives:
                alt = self._normalize_text(alternative)
                if alt and self._contains_match(alt, pool):
                    return self._result("partial", "alternative", alternative)

        if category in ("skill", "tool"):
            keywords = self._concept_keywords(options)

            # 3) Khái niệm trừu tượng -> công nghệ cụ thể trong skill list.
            for keyword in keywords:
                if "*" in keyword or keyword.startswith("re:"):
                    continue
                if self._contains_match(self._normalize_text(keyword), pool):
                    return self._result("matched", "concept", keyword)

            # 4) Chỉ có bằng chứng trong mô tả kinh nghiệm/dự án.
            evidence = candidate["evidence_text"]
            for keyword in options + keywords:
                if len(keyword.rstrip("*")) < 3:
                    continue
                if self._has_keyword(evidence, keyword):
                    return self._result("partial", "evidence", keyword)

        if category == "certification":
            hit = self._certification_partial(name, pool)
            if hit:
                return self._result("partial", "same_vendor", hit)

        return self._result("missing", "", "")

    @staticmethod
    def _result(status: str, via: str, matched_by: str) -> Dict[str, str]:
        return {"status": status, "via": via, "matched_by": matched_by}

    def _evaluate_soft_skill(
        self,
        name: str,
        candidate: Dict[str, Any],
    ) -> Dict[str, Any]:
        canonical = self._canonical_soft_skill(name)

        # Soft skill khai báo tường minh trong CV.
        explicit = candidate["pools"].get("soft_skill", [])
        if self._contains_match(self._normalize_text(name), explicit):
            return self._result("matched", "direct", name)

        if canonical:
            if canonical in candidate["soft_skill_canonicals"]:
                return self._result("matched", "evidence", canonical)
            return self._result("missing", "", "")

        # Không có trong lexicon: thử tìm cụm từ trong bằng chứng.
        if self._has_keyword(candidate["soft_text"], name):
            return self._result("partial", "evidence", name)

        return self._result("missing", "", "")

    def _canonical_soft_skill(self, text: str) -> Optional[str]:
        """Chọn nhóm soft skill có từ khóa khớp DÀI nhất."""
        normalized = self._nfc_fold(text)
        best, best_len = None, 0

        for canonical, keywords in self.SOFT_SKILL_LEXICON.items():
            for keyword in keywords:
                if self._has_keyword(normalized, keyword):
                    length = len(keyword.rstrip("*"))
                    if length > best_len:
                        best, best_len = canonical, length

        return best

    def _detect_soft_skills(self, text: str) -> List[str]:
        found = []
        for canonical, keywords in self.SOFT_SKILL_LEXICON.items():
            if any(self._has_keyword(text, kw) for kw in keywords):
                found.append(canonical)
        return found

    def _concept_keywords(self, options: List[str]) -> List[str]:
        keywords: List[str] = []
        for option in options:
            key = self._nfc_fold(option)
            for concept in (key, re.sub(r"\s+", " ", key)):
                for kw in self.CONCEPT_MAP.get(concept, []):
                    if kw not in keywords:
                        keywords.append(kw)
        return keywords

    @staticmethod
    def _split_options(name: str) -> List[str]:
        """'React hoặc Vue' / 'Python or Java' -> ['React', 'Vue']."""
        parts = re.split(r"\s+(?:hoặc|or)\s+", name, flags=re.IGNORECASE)
        parts = [p.strip() for p in parts if p.strip()]
        return parts or [name]

    def _certification_partial(
        self,
        required: str,
        pool: List[str],
    ) -> Optional[str]:
        generic = {
            "certified", "certificate", "certification", "chứng", "chỉ",
            "professional", "associate", "foundation", "foundations",
        }
        tokens = {
            t for t in re.findall(r"\w+", self._nfc_fold(required))
            if len(t) >= 3 and t not in generic
        }
        for candidate_cert in pool:
            cert_tokens = set(re.findall(r"\w+", candidate_cert))
            if tokens & cert_tokens:
                return candidate_cert
        return None

    # =========================================================
    # EXPERIENCE
    # =========================================================

    def _compare_experience(
        self,
        requirements: List[Dict[str, Any]],
        actual_years: float,
    ) -> Dict[str, Any]:
        experience = next(
            (
                item for item in requirements
                if str(item.get("category", "")).lower() == "experience"
            ),
            None,
        )

        if not experience:
            return {
                "required": {},
                "actual_years": actual_years,
                "score": 100.0,
                "gap": 0.0,
                "status": "not_specified",
                "over_qualified": False,
            }

        minimum = self._to_float(experience.get("minimum_years"))
        maximum = self._to_float(experience.get("maximum_years"))

        over_qualified = False

        if minimum is None:
            score, gap, status = 100.0, 0.0, "not_specified"
        elif minimum <= 0:
            # Level không yêu cầu số năm tối thiểu: không phản ánh mức độ
            # liên quan => KHÔNG tính vào điểm tổng.
            score, gap, status = 100.0, 0.0, "not_required"
        elif actual_years >= minimum:
            score, gap, status = 100.0, 0.0, "meets"
            if maximum is not None and actual_years > maximum + 1.0:
                status = "above_range"
                over_qualified = True
        else:
            gap = minimum - actual_years
            score = round(max(0.0, actual_years / minimum * 100), 2)
            status = "below_requirement"

        return {
            "required": {
                "minimum_years": minimum,
                "maximum_years": maximum,
                "description": experience.get("description", ""),
            },
            "actual_years": actual_years,
            "score": round(score, 2),
            "gap": round(gap, 2),
            "status": status,
            "over_qualified": over_qualified,
        }

    @staticmethod
    def _to_float(value: Any) -> Optional[float]:
        try:
            return float(value) if value is not None else None
        except (TypeError, ValueError):
            return None

    # =========================================================
    # RESPONSIBILITIES
    # =========================================================

    def _compare_responsibilities(
        self,
        responsibilities: List[str],
        experience: List[Dict[str, Any]],
        projects: List[Dict[str, Any]],
        evidence_text: Optional[str] = None,
    ) -> Dict[str, Any]:
        responsibilities = [
            re.sub(r"^[\-•*\s]+", "", str(r)).strip()
            for r in responsibilities
            if str(r).strip()
        ]

        empty = {
            "required": responsibilities,
            "matched": [],
            "missing": [],
            "score": 100.0,
            "active": False,
            "skipped_reason": "",
        }

        if not responsibilities:
            return empty

        if evidence_text is None:
            evidence_text = self._collect_evidence_text(experience, projects)

        if not evidence_text.strip():
            return {
                **empty,
                "missing": list(responsibilities),
                "score": 0.0,
                "active": True,
            }

        cv_vi = self._is_vietnamese(evidence_text)

        matched, missing, skipped = [], [], []

        for text in responsibilities:
            mapped = RESPONSIBILITY_KEYWORDS.get(_fold_key(text))

            # 1) Responsibility của framework: từ khóa song ngữ -> dùng
            #    được cho cả CV tiếng Anh lẫn tiếng Việt.
            if mapped:
                found = any(
                    self._has_keyword(evidence_text, kw) for kw in mapped
                )
                (matched if found else missing).append(text)
                continue

            # 2) Responsibility tự do (JD): khác ngôn ngữ với CV thì so
            #    khớp từ khóa vô nghĩa -> bỏ qua, không phạt oan.
            if self._is_vietnamese(text) != cv_vi:
                skipped.append(text)
                continue

            keywords = self._extract_keywords(text)
            hits = [
                kw for kw in keywords
                if self._has_keyword(evidence_text, kw + "*")
            ]
            enough = bool(keywords) and (
                len(hits) >= 2 or len(hits) / len(keywords) >= 0.4
            )
            (matched if enough else missing).append(text)

        total = len(matched) + len(missing)
        score = round(len(matched) / total * 100, 2) if total else 100.0

        reason = ""
        if skipped:
            reason = (
                f"Bỏ qua {len(skipped)} responsibilities viết khác ngôn ngữ "
                f"với CV (không có bảng từ khóa song ngữ); các mục này "
                f"không được tính vào điểm."
            )

        return {
            "required": responsibilities,
            "matched": matched,
            "missing": missing,
            "skipped": skipped,
            "score": score,
            "active": total > 0,
            "skipped_reason": reason,
        }

    @staticmethod
    def _is_vietnamese(text: str) -> bool:
        letters = [c for c in text.casefold() if c.isalpha()]
        if not letters:
            return False
        vi = sum(1 for c in letters if c in VIETNAMESE_CHARS)
        return vi / len(letters) > 0.02

    # =========================================================
    # PREFERRED (nice-to-have): chỉ báo cáo, không tính điểm
    # =========================================================

    def _compare_preferred(
        self,
        requirements: Dict[str, Any],
        candidate: Dict[str, Any],
    ) -> Dict[str, Any]:
        items = requirements.get("preferred_qualifications", [])
        if not isinstance(items, list):
            items = []

        matched, partial, missing = [], [], []

        for item in items:
            if not isinstance(item, dict) or not item.get("name"):
                continue
            category = str(item.get("category", "skill")).lower()
            if category not in (
                "skill", "tool", "soft_skill", "language",
                "education", "certification",
            ):
                category = "skill"
            result = self._evaluate_requirement(item, category, candidate)
            entry = {"name": item["name"], "category": category}
            {"matched": matched, "partial": partial,
             "missing": missing}[result["status"]].append(entry)

        return {"matched": matched, "partial": partial, "missing": missing}

    # =========================================================
    # CANDIDATE NORMALIZATION
    # =========================================================

    def _normalize_candidate(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        skills_field = profile.get("skills", [])

        if isinstance(skills_field, dict):
            skill_items = skills_field.get("items")
            if skill_items is None:
                skill_items = skills_field.get("technical", [])
        else:
            skill_items = skills_field

        skills = self._names(skill_items)

        explicit_soft = self._names(
            profile.get("soft_skills")
            or (skills_field.get("soft")
                if isinstance(skills_field, dict) else None)
        )
        tools_list = self._names(
            profile.get("tools")
            or (skills_field.get("tools")
                if isinstance(skills_field, dict) else None)
        ) or skills

        languages = self._language_names(profile.get("languages"))
        languages += self._languages_from_skill_groups(profile)
        education = self._extract_education(profile)
        certifications = self._extract_certifications(profile)

        experience = self._to_dict_list(profile.get("experience"))
        projects = self._to_dict_list(profile.get("projects"))

        evidence_text = self._collect_evidence_text(experience, projects)
        evidence_text += "\n" + self._nfc_fold(
            " ".join(self._achievement_texts(profile))
        )
        evidence_text += "\n" + self._nfc_fold(" ".join(certifications))

        summary_text = self._nfc_fold(self._summary_text(profile))
        other_text = self._other_text(profile)
        soft_text = evidence_text + "\n" + summary_text + "\n" + other_text

        pools = {
            "skill": [self._normalize_text(s) for s in skills if s],
            "tool": [self._normalize_text(s) for s in tools_list if s],
            "soft_skill": [self._normalize_text(s) for s in explicit_soft],
            "language": [self._normalize_text(s) for s in languages],
            "education": [self._normalize_text(s) for s in education],
            "certification": [
                self._normalize_text(s) for s in certifications
            ],
        }

        return {
            "skills": skills,
            "pools": pools,
            "education": education,
            "certifications": certifications,
            "experience": experience,
            "projects": projects,
            "experience_years": self._extract_experience_years(profile),
            "evidence_text": evidence_text,
            "soft_text": soft_text,
            "other_text": other_text,
            "soft_skill_canonicals": set(
                self._detect_soft_skills(soft_text)
            ),
        }

    def _names(self, value: Any) -> List[str]:
        """list[str | dict] -> list[str] (lấy field name nếu là dict)."""
        if value is None:
            return []
        if not isinstance(value, list):
            value = [value]

        result = []
        for item in value:
            if isinstance(item, dict):
                item = (
                    item.get("name") or item.get("skill")
                    or item.get("normalized") or ""
                )
            text = str(item).strip()
            if text:
                result.append(text)
        return self._unique(result)

    _SPOKEN_RE = re.compile(
        r"\b(?:english|japanese|korean|chinese|french|german|spanish|"
        r"vietnamese|ielts|toeic|toefl|jlpt|topik|hsk|delf|cefr|tiếng)\b"
        r"|\b[abc][12]\b",
        re.IGNORECASE,
    )

    def _languages_from_skill_groups(self, profile: Dict[str, Any]):
        """Ngoại ngữ khai báo trong Skills ("Language: English(B2)").
        Chỉ nhận giá trị là ngoại ngữ thật, không nhầm với nhóm "Languages"
        gồm ngôn ngữ lập trình."""
        groups = profile.get("skill_groups")
        if not isinstance(groups, dict):
            return []

        result = []
        for name, values in groups.items():
            if not re.fullmatch(
                r"(?i)languages?|language skills|ngoại ngữ|ngôn ngữ",
                str(name).strip(),
            ):
                continue
            result += [
                str(v) for v in values if self._SPOKEN_RE.search(str(v))
            ]
        return result

    def _language_names(self, value: Any) -> List[str]:
        if value is None:
            return []
        if not isinstance(value, list):
            value = [value]

        result = []
        for item in value:
            if isinstance(item, dict):
                item = " ".join(
                    str(v) for v in (
                        item.get("language"), item.get("name"),
                        item.get("level"),
                    ) if v
                )
            text = str(item).strip()
            if text:
                result.append(text)
        return result

    _INTEREST_RE = re.compile(r"interest|hobb|sở thích", re.IGNORECASE)
    _DATE_RANGE_RE = re.compile(
        r"(?:\d{1,2}\s*/\s*)?(?:19|20)\d{2}\s*[-–—]\s*"
        r"(?:(?:\d{1,2}\s*/\s*)?(?:19|20)\d{2}"
        r"|present|now|current(?:ly)?|nay|hiện tại)",
        re.IGNORECASE,
    )

    def _other_text(self, profile: Dict[str, Any]) -> str:
        """Văn bản từ các mục ngoài (Activities, More information...),
        trừ Sở thích; bỏ mốc ngày để chữ 'Present/Now' không bị coi là
        kỹ năng."""
        parts = []
        for item in profile.get("other_sections") or []:
            if not isinstance(item, dict):
                continue
            heading = str(item.get("section") or "")
            if self._INTEREST_RE.search(heading):
                continue
            parts.append(heading)
            parts.append(str(item.get("content") or ""))

        return self._nfc_fold(self._DATE_RANGE_RE.sub(" ", " ".join(parts)))

    @staticmethod
    def _summary_text(profile: Dict[str, Any]) -> str:
        summary = profile.get("summary")
        if isinstance(summary, dict):
            return str(summary.get("text") or "")
        return str(summary or "")

    @staticmethod
    def _achievement_texts(profile: Dict[str, Any]) -> List[str]:
        result = []
        for item in profile.get("achievements", []) or []:
            if isinstance(item, dict) and item.get("text"):
                result.append(str(item["text"]))
        return result

    def _extract_certifications(self, profile: Dict[str, Any]) -> List[str]:
        certifications = profile.get("certifications", [])

        if not isinstance(certifications, list):
            return self._to_list(certifications)

        result = []
        for item in certifications:
            if isinstance(item, dict):
                name = (
                    item.get("name") or item.get("title")
                    or item.get("certification")
                )
                if name:
                    result.append(str(name).strip())
            elif item:
                result.append(str(item).strip())

        return self._unique(result)

    def _extract_education(self, profile: Dict[str, Any]) -> List[str]:
        education = profile.get("education", [])

        if isinstance(education, list):
            result = []
            for item in education:
                if isinstance(item, dict):
                    values = [
                        item.get("degree"), item.get("field"),
                        item.get("major"), item.get("school"),
                        item.get("institution"),
                    ]
                    result.extend(str(v).strip() for v in values if v)
                else:
                    result.append(str(item).strip())
            return self._unique(result)

        return self._to_list(education)

    def _extract_experience_years(self, profile: Dict[str, Any]) -> float:
        career = profile.get("career", {})
        if isinstance(career, dict):
            value = career.get("total_experience_years")
            if value is not None:
                try:
                    return max(0.0, float(value))
                except (TypeError, ValueError):
                    pass

        value = profile.get("total_experience_years")
        if value is not None:
            try:
                return max(0.0, float(value))
            except (TypeError, ValueError):
                pass

        total = 0.0
        for item in self._to_dict_list(profile.get("experience")):
            value = item.get("duration_years")
            if value is not None:
                try:
                    total += max(0.0, float(value))
                except (TypeError, ValueError):
                    continue

        return round(total, 2)

    # =========================================================
    # SCORING
    # =========================================================

    @staticmethod
    def _score(analysis: Dict[str, Any]) -> float:
        required = len(analysis.get("required", []))
        if required == 0:
            return 100.0

        matched = len(analysis.get("matched", []))
        partial = len(analysis.get("partial", []))

        return round(((matched + partial * 0.5) / required) * 100, 2)

    def _weighted_score(
        self,
        component_scores: Dict[str, float],
        active: set,
    ):
        """Chuẩn hóa trọng số CHỈ trên các nhóm có yêu cầu thật."""
        active_weights = {
            key: weight
            for key, weight in self.DEFAULT_WEIGHTS.items()
            if key in component_scores and key in active
        }

        total_weight = sum(active_weights.values())
        if total_weight == 0:
            return 0.0, {}

        score = sum(
            component_scores[key] * weight
            for key, weight in active_weights.items()
        ) / total_weight

        weights_used = {
            key: round(weight / total_weight, 4)
            for key, weight in active_weights.items()
        }

        return round(score, 2), weights_used

    # =========================================================
    # GAP / PRIORITY / SUMMARY
    # =========================================================

    def _build_gaps(
        self,
        analyses: Dict[str, Dict[str, Any]],
        experience_analysis: Dict[str, Any],
        responsibility_analysis: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        gaps = []

        for category, analysis in analyses.items():
            for detail in analysis.get("items", []):
                if detail["status"] == "missing":
                    gaps.append({
                        "category": category,
                        "item": detail["name"],
                        "gap": "missing",
                        "importance": detail.get("importance", "must_have"),
                    })
                elif detail["status"] == "partial":
                    gaps.append({
                        "category": category,
                        "item": detail["name"],
                        "gap": "partial",
                        "via": detail.get("via", ""),
                        "matched_by": detail.get("matched_by", ""),
                        "importance": detail.get("importance", "must_have"),
                    })

        if experience_analysis.get("status") == "below_requirement":
            gaps.append({
                "category": "experience",
                "item": "Professional Experience",
                "gap": experience_analysis.get("gap", 0),
                "importance": "must_have",
                "description": (
                    f"Thiếu {experience_analysis.get('gap', 0)} năm kinh "
                    f"nghiệm so với mức tối thiểu."
                ),
            })

        for text in responsibility_analysis.get("missing", []):
            gaps.append({
                "category": "responsibility",
                "item": text,
                "gap": "missing",
                "importance": "must_have",
            })

        return gaps

    def _build_priorities(
        self,
        scores: Dict[str, float],
        gaps: List[Dict[str, Any]],
        active: set,
    ) -> List[Dict[str, Any]]:
        """Sắp xếp theo mức điểm có thể cải thiện (trọng số x thiếu hụt)."""
        total_weight = sum(
            w for k, w in self.DEFAULT_WEIGHTS.items() if k in active
        ) or 1.0

        ranked = []
        for category, score in scores.items():
            if category not in active or score >= 100:
                continue
            weight = self.DEFAULT_WEIGHTS.get(category, 0) / total_weight
            ranked.append((category, score, (100 - score) * weight))

        ranked.sort(key=lambda row: row[2], reverse=True)

        priorities = []
        for category, score, gain in ranked:
            priorities.append({
                "category": category,
                "score": round(score, 2),
                "potential_gain": round(gain, 2),
                "gaps": [
                    gap.get("item") for gap in gaps
                    if gap.get("category") == category
                ],
            })

        return priorities

    @staticmethod
    def _build_summary(
        score: float,
        gaps: List[Dict[str, Any]],
        priorities: List[Dict[str, Any]],
    ) -> str:
        if not gaps:
            return (
                f"Candidate đáp ứng các yêu cầu đã khai báo; "
                f"điểm tổng hợp là {score:.2f}/100."
            )

        top = priorities[0]["category"] if priorities else "requirements"

        return (
            f"Điểm tổng hợp {score:.2f}/100. "
            f"Có {len(gaps)} khoảng thiếu/chưa đủ bằng chứng cần xem xét; "
            f"nhóm nên ưu tiên cải thiện là {top}."
        )

    # =========================================================
    # HELPERS
    # =========================================================

    @staticmethod
    def _get_source(requirements: Dict[str, Any]) -> str:
        requirement_type = requirements.get("type")

        if requirement_type == "job_description":
            return "job_description"

        if requirement_type == "career_framework":
            return "career_framework"

        if "level_requirements" in requirements:
            return "career_framework"

        metadata = requirements.get("metadata", {})

        if isinstance(metadata, dict):
            source = metadata.get("source")
            if source:
                return str(source)

        return "unknown"

    @staticmethod
    def _to_list(value: Any) -> List[str]:
        if value is None:
            return []

        if isinstance(value, list):
            return [str(i).strip() for i in value if str(i).strip()]

        text = str(value).strip()
        return [text] if text else []

    @staticmethod
    def _to_dict_list(value: Any) -> List[Dict[str, Any]]:
        if not isinstance(value, list):
            return []
        return [item for item in value if isinstance(item, dict)]

    @staticmethod
    def _unique(items: List[str]) -> List[str]:
        result, seen = [], set()
        for item in items:
            clean = str(item).strip()
            key = clean.casefold()
            if clean and key not in seen:
                seen.add(key)
                result.append(clean)
        return result

    @staticmethod
    def _nfc_fold(value: Any) -> str:
        """NFC + casefold + gộp khoảng trắng (PDF hay trả NFD)."""
        text = unicodedata.normalize("NFC", str(value or ""))
        return " ".join(text.strip().casefold().split())

    @classmethod
    def _normalize_text(cls, value: Any) -> str:
        text = cls._nfc_fold(value)
        return cls.ALIAS_MAP.get(text, text)

    @staticmethod
    @lru_cache(maxsize=2048)
    def _keyword_pattern(keyword: str):
        stem = keyword.endswith("*")
        core = re.escape(keyword.rstrip("*").strip().casefold())
        tail = r"\w*" if stem else r"(?![\w+#])"
        return re.compile(
            r"(?<![\w+#])" + core + tail,
            re.IGNORECASE | re.UNICODE,
        )

    @staticmethod
    @lru_cache(maxsize=512)
    def _regex(pattern: str):
        return re.compile(pattern, re.IGNORECASE | re.UNICODE)

    @classmethod
    def _has_keyword(cls, text: str, keyword: str) -> bool:
        if not text or not keyword:
            return False
        if keyword.startswith("re:"):
            return cls._regex(keyword[3:]).search(text) is not None
        return cls._keyword_pattern(keyword).search(text) is not None

    @classmethod
    def _safe_phrase(cls, phrase: str, text: str) -> bool:
        """`phrase` là cụm trọn vẹn trong `text` (có ranh giới từ),
        loại các cặp không tương đương (React vs React Native, C vs C++)."""
        if not phrase or not text:
            return False

        for base, extended in cls.NON_EQUIVALENT:
            if phrase == base:
                text = text.replace(extended, " ")

        pattern = r"(?<![\w+#])" + re.escape(phrase) + r"(?![\w+#])"
        return re.search(pattern, text, flags=re.IGNORECASE) is not None

    @classmethod
    def _variants(cls, term: str) -> List[str]:
        for group in cls.EQUIVALENT_GROUPS:
            if term in group:
                return [term] + sorted(group - {term})
        return [term]

    @classmethod
    def _contains_match(cls, target: str, candidates: List[str]) -> bool:
        if not target:
            return False

        variants = cls._variants(target)

        for candidate in candidates:
            if not candidate:
                continue

            for variant in variants:
                if variant == candidate:
                    return True
                # Chỉ cho phép yêu cầu nằm TRONG skill của ứng viên
                # ("python" trong "python 3"). Chiều ngược lại bị bỏ vì
                # làm "API" khớp nhầm yêu cầu "API design".
                if cls._safe_phrase(variant, candidate):
                    return True

        return False

    @classmethod
    def _collect_evidence_text(
        cls,
        experience: List[Dict[str, Any]],
        projects: List[Dict[str, Any]],
    ) -> str:
        values = []

        for item in experience + projects:
            for key in (
                "role", "title", "position", "name", "description",
                "summary", "responsibilities", "achievements",
                "technologies", "skills", "text", "repository", "repo",
            ):
                value = item.get(key)

                if isinstance(value, list):
                    values.extend(str(v) for v in value)
                elif value:
                    values.append(str(value))

        return cls._nfc_fold(" ".join(values))

    @staticmethod
    def _extract_keywords(text: str) -> List[str]:
        stopwords = {
            "and", "the", "with", "for", "from", "into", "using", "build",
            "develop", "development", "work", "working", "team", "your",
            "have", "will", "that", "this", "are", "our",
            "phối", "hợp", "với", "các", "và", "trong", "thực", "hiện",
            "xây", "dựng", "phát", "triển", "cho", "của", "một", "những",
        }

        words = []
        for word in unicodedata.normalize("NFC", text).casefold() \
                .replace("/", " ").split():
            clean = "".join(
                char for char in word if char.isalnum() or char in "+#.-"
            ).strip(".-")
            if len(clean) >= 3 and clean not in stopwords:
                if clean not in words:
                    words.append(clean)

        return words[:12]


# API hàm đơn giản để module khác có thể gọi trực tiếp.
def analyze(
    candidate_profile: Dict[str, Any],
    requirements: Dict[str, Any],
) -> Dict[str, Any]:
    return CareerIntelligence().analyze(candidate_profile, requirements)
