from copy import deepcopy
from typing import Any, Dict, List, Optional
import difflib


class CareerFramework:
    """
    Cung cấp bộ tiêu chuẩn năng lực cho các nghề nghiệp
    và các cấp độ nghề nghiệp khác nhau.

    Module này không:
    - đọc CV
    - xử lý PDF
    - xử lý NLP
    - phân tích ứng viên
    - đưa ra kết luận về ứng viên

    Module này chỉ cung cấp career expectations.
    """

    def __init__(self) -> None:
        self.frameworks = self._build_frameworks()

    def get_framework(
        self,
        role: str,
        level: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Lấy framework theo tên nghề nghiệp.

        Nếu truyền level thì trả về framework của
        một cấp độ cụ thể.
        """

        canonical_role = self.find_role(role)
        normalized_role = (
            canonical_role
            if canonical_role is not None
            else self._normalize_role(role)
        )
        framework = self.frameworks.get(normalized_role)

        if framework is None:
            return None

        result = deepcopy(framework)

        if level is not None:
            normalized_level = self._normalize_level(level)
            result["selected_level"] = normalized_level
            result["level_requirements"] = deepcopy(
                result["levels"].get(normalized_level)
            )

            # Defense-in-depth: nếu sau cả bước alias + fuzzy-match vẫn
            # không tìm được level hợp lệ, đánh dấu rõ ràng để
            # career_intelligence.py / main.py có thể cảnh báo người dùng,
            # thay vì âm thầm coi như "không có yêu cầu nào" (dẫn đến điểm
            # số 100/100 giả tạo).
            result["level_recognized"] = (
                result["level_requirements"] is not None
            )

        return result

    def get_level_requirements(
        self,
        role: str,
        level: str
    ) -> Optional[Dict[str, Any]]:
        """
        Lấy riêng yêu cầu của một nghề nghiệp ở một cấp độ.
        """

        framework = self.get_framework(role)

        if framework is None:
            return None

        normalized_level = self._normalize_level(level)

        return deepcopy(
            framework["levels"].get(normalized_level)
        )

    def list_roles(self) -> List[str]:
        """
        Trả về danh sách nghề nghiệp đang được hỗ trợ.
        """

        return sorted(self.frameworks.keys())

    def list_levels(self) -> List[str]:
        """
        Trả về danh sách cấp độ nghề nghiệp.
        """

        return [
            "intern",
            "fresher",
            "junior",
            "middle",
            "senior",
            "lead"
        ]

    def find_role(self, role: str) -> Optional[str]:
        """
        Tìm tên nghề nghiệp chuẩn từ tên hoặc alias.

        Cũng áp dụng fuzzy-match cho role, cùng lý do như level ở
        _normalize_level(): tránh một lỗi gõ nhỏ (vd "backend dev",
        "fronend developer") khiến framework không được tìm thấy và
        career_intelligence.analyze() nhận requirements rỗng một cách
        âm thầm.
        """

        normalized_role = self._normalize_role(role)

        if normalized_role in self.frameworks:
            return normalized_role

        alias_to_canonical = {}

        for canonical_role, framework in self.frameworks.items():
            alias_to_canonical[canonical_role] = canonical_role

            for alias in framework.get("aliases", []):
                alias_to_canonical[
                    self._normalize_role(alias)
                ] = canonical_role

        if normalized_role in alias_to_canonical:
            return alias_to_canonical[normalized_role]

        close_matches = difflib.get_close_matches(
            normalized_role,
            list(alias_to_canonical.keys()),
            n=1,
            cutoff=0.75,
        )

        if close_matches:
            return alias_to_canonical[close_matches[0]]

        return None

    def _normalize_role(self, role: str) -> str:
        if not role:
            return ""

        return " ".join(
            role.strip().lower().split()
        )

    def _normalize_level(self, level: str) -> str:
        """
        BUG CŨ: nếu level truyền vào không khớp CHÍNH XÁC với alias hoặc
        tên level chuẩn (vd người dùng gõ nhầm "intership" thay vì
        "intern"/"internship"), hàm này trả thẳng lại chuỗi gốc đã lower
        (vd "intership"). Ở get_framework(), "intership" không tồn tại
        trong result["levels"] -> level_requirements = None -> ở
        career_intelligence.py, requirement_items rỗng -> điểm số mặc định
        thành 100/100 cho MỌI category dù không hề so khớp gì cả. Đây là
        lỗi rất nguy hiểm vì im lặng trả về kết quả "hoàn hảo" sai.

        Fix: bổ sung thêm alias "internship", đồng thời fuzzy-match (dựa
        trên difflib) để tự sửa các lỗi gõ gần đúng như "intership",
        "senoir", "midle"...
        """
        # FIX: level rỗng trước đây trả "entry" (KHÔNG phải level hợp lệ) ->
        # level_requirements = None -> điểm 100/100 giả. Nay trả "" để
        # get_framework() đánh dấu level_recognized = False và
        # career_intelligence.analyze() raise ValueError rõ ràng.
        if not level or not str(level).strip():
            return ""

        aliases = {
            "intern": "intern",
            "internship": "intern",
            "trainee": "intern",
            "student": "intern",

            "fresher": "fresher",
            "entry level": "fresher",
            "entry-level": "fresher",
            "entry": "fresher",

            "junior": "junior",
            "jr": "junior",

            "middle": "middle",
            "mid": "middle",
            "mid-level": "middle",

            "senior": "senior",
            "sr": "senior",

            "lead": "lead",
            "tech lead": "lead",
            "team lead": "lead"
        }

        normalized_level = " ".join(
            level.strip().lower().split()
        )

        if normalized_level in aliases:
            return aliases[normalized_level]

        canonical_levels = set(self.list_levels())

        if normalized_level in canonical_levels:
            return normalized_level

        # Fuzzy-match để tự sửa các lỗi gõ gần đúng, tránh việc một lỗi
        # chính tả nhỏ khiến toàn bộ career framework bị bỏ qua âm thầm.
        candidates = list(aliases.keys()) + list(canonical_levels)
        close_matches = difflib.get_close_matches(
            normalized_level,
            candidates,
            n=1,
            cutoff=0.6,
        )

        if close_matches:
            matched = close_matches[0]
            return aliases.get(matched, matched)

        return normalized_level

    def _build_frameworks(self) -> Dict[str, Dict[str, Any]]:
        return {
            "frontend developer": self._frontend_framework(),
            "backend developer": self._backend_framework(),
            "mobile developer": self._mobile_framework(),
            "qa engineer": self._qa_framework(),
            "data scientist": self._data_scientist_framework(),
            "data engineer": self._data_engineer_framework(),
            "machine learning engineer": self._ml_engineer_framework(),
            "devops engineer": self._devops_framework(),
            "cloud engineer": self._cloud_engineer_framework(),
            "business analyst": self._business_analyst_framework(),
            "ui/ux designer": self._uiux_framework(),
            "cybersecurity engineer": self._cybersecurity_framework(),
            "system administrator": self._sysadmin_framework(),
            "network engineer": self._network_engineer_framework(),
            "database administrator": self._dba_framework(),
        }

    def _frontend_framework(self) -> Dict[str, Any]:
        return {
            "role": "Frontend Developer",
            "aliases": [
                "Frontend Engineer",
                "Front-end Developer",
                "Web Developer"
            ],
            "description": (
                "Phát triển giao diện người dùng cho website "
                "và ứng dụng web."
            ),
            "levels": {
                "intern": {
                    "summary": (
                        "Có kiến thức nền tảng về HTML, CSS, JavaScript "
                        "và có thể xây dựng giao diện đơn giản."
                    ),
                    "core_skills": [
                        "HTML",
                        "CSS",
                        "JavaScript",
                        "Responsive Design"
                    ],
                    "technical_skills": [
                        "DOM",
                        "HTTP basics",
                        "Form handling",
                        "Basic accessibility"
                    ],
                    "tools": [
                        "Git",
                        "GitHub",
                        "Browser DevTools"
                    ],
                    "responsibilities": [
                        "Xây dựng giao diện đơn giản",
                        "Chuyển thiết kế thành giao diện",
                        "Sửa lỗi giao diện cơ bản"
                    ],
                    "expected_knowledge": [
                        "Cấu trúc HTML",
                        "CSS layout",
                        "Flexbox",
                        "Grid",
                        "JavaScript cơ bản"
                    ],
                    "expected_achievements": [
                        "Có ít nhất một dự án giao diện",
                        "Có thể sử dụng Git",
                        "Có thể triển khai website đơn giản"
                    ],
                    "soft_skills": [
                        "Tự học",
                        "Giao tiếp cơ bản",
                        "Làm việc nhóm"
                    ],
                    "typical_experience_years": {
                        "min": 0,
                        "max": 0
                    }
                },
                "fresher": {
                    "summary": (
                        "Có thể xây dựng và duy trì các giao diện web "
                        "đơn giản dưới sự hướng dẫn."
                    ),
                    "core_skills": [
                        "HTML",
                        "CSS",
                        "JavaScript",
                        "Responsive Design"
                    ],
                    "technical_skills": [
                        "React hoặc framework tương đương",
                        "REST API integration",
                        "State management cơ bản",
                        "Component-based development",
                        "Basic testing"
                    ],
                    "tools": [
                        "Git",
                        "GitHub",
                        "npm",
                        "Browser DevTools"
                    ],
                    "responsibilities": [
                        "Phát triển tính năng giao diện",
                        "Tích hợp API",
                        "Sửa lỗi và cải thiện UI",
                        "Viết code theo coding convention"
                    ],
                    "expected_knowledge": [
                        "JavaScript hiện đại",
                        "Component",
                        "Props và state",
                        "HTTP và JSON",
                        "Responsive Design"
                    ],
                    "expected_achievements": [
                        "Có dự án web hoàn chỉnh",
                        "Có sản phẩm có thể chạy thử",
                        "Có khả năng làm việc với API"
                    ],
                    "soft_skills": [
                        "Giải quyết vấn đề",
                        "Làm việc nhóm",
                        "Quản lý thời gian"
                    ],
                    "typical_experience_years": {
                        "min": 0,
                        "max": 1
                    }
                },
                "junior": {
                    "summary": (
                        "Có thể độc lập phát triển các tính năng frontend "
                        "với phạm vi và độ phức tạp vừa phải."
                    ),
                    "core_skills": [
                        "JavaScript",
                        "TypeScript",
                        "React hoặc Vue",
                        "Responsive Design"
                    ],
                    "technical_skills": [
                        "State management",
                        "API integration",
                        "Performance optimization",
                        "Testing",
                        "Accessibility",
                        "Reusable components"
                    ],
                    "tools": [
                        "Git",
                        "CI basics",
                        "Package managers",
                        "Browser DevTools"
                    ],
                    "responsibilities": [
                        "Phát triển tính năng độc lập",
                        "Review code đơn giản",
                        "Phân tích và sửa lỗi",
                        "Cải thiện hiệu năng giao diện"
                    ],
                    "expected_knowledge": [
                        "Kiến trúc frontend",
                        "Asynchronous JavaScript",
                        "Security cơ bản",
                        "Testing strategy",
                        "Web performance"
                    ],
                    "expected_achievements": [
                        "Hoàn thành nhiều tính năng thực tế",
                        "Có đóng góp vào codebase nhóm",
                        "Có bằng chứng cải thiện hiệu năng hoặc chất lượng"
                    ],
                    "soft_skills": [
                        "Chủ động",
                        "Phối hợp nhóm",
                        "Tư duy phản biện"
                    ],
                    "typical_experience_years": {
                        "min": 1,
                        "max": 2.5
                    }
                },
                "middle": {
                    "summary": (
                        "Có thể thiết kế giải pháp frontend, xử lý vấn đề "
                        "phức tạp và hỗ trợ các thành viên khác."
                    ),
                    "core_skills": [
                        "Advanced JavaScript",
                        "TypeScript",
                        "Frontend architecture"
                    ],
                    "technical_skills": [
                        "Design patterns",
                        "Performance profiling",
                        "Testing architecture",
                        "Accessibility",
                        "Security",
                        "Build optimization"
                    ],
                    "tools": [
                        "CI/CD",
                        "Monitoring",
                        "Git workflows"
                    ],
                    "responsibilities": [
                        "Thiết kế kiến trúc frontend",
                        "Đưa ra quyết định kỹ thuật",
                        "Review code",
                        "Hỗ trợ thành viên junior"
                    ],
                    "expected_knowledge": [
                        "Kiến trúc ứng dụng",
                        "Khả năng mở rộng",
                        "Hiệu năng",
                        "Bảo mật frontend"
                    ],
                    "expected_achievements": [
                        "Dẫn dắt một module",
                        "Cải thiện chất lượng codebase",
                        "Giải quyết vấn đề kỹ thuật khó"
                    ],
                    "soft_skills": [
                        "Mentoring",
                        "Giao tiếp kỹ thuật",
                        "Ra quyết định"
                    ],
                    "typical_experience_years": {
                        "min": 2.5,
                        "max": 3.5
                    }
                },
                "senior": {
                    "summary": (
                        "Có khả năng định hướng kỹ thuật frontend "
                        "cho sản phẩm hoặc hệ thống lớn."
                    ),
                    "core_skills": [
                        "Frontend architecture",
                        "Technical leadership"
                    ],
                    "technical_skills": [
                        "Scalability",
                        "System design",
                        "Performance strategy",
                        "Security strategy",
                        "Engineering standards"
                    ],
                    "tools": [
                        "CI/CD",
                        "Observability",
                        "Architecture documentation"
                    ],
                    "responsibilities": [
                        "Định hướng kiến trúc",
                        "Thiết lập tiêu chuẩn kỹ thuật",
                        "Đánh giá giải pháp",
                        "Hỗ trợ quyết định cấp sản phẩm"
                    ],
                    "expected_knowledge": [
                        "Thiết kế hệ thống",
                        "Trade-off kỹ thuật",
                        "Khả năng mở rộng",
                        "Quản trị chất lượng"
                    ],
                    "expected_achievements": [
                        "Dẫn dắt hệ thống hoặc sản phẩm lớn",
                        "Cải thiện chỉ số kỹ thuật",
                        "Đào tạo và phát triển thành viên"
                    ],
                    "soft_skills": [
                        "Lãnh đạo",
                        "Định hướng",
                        "Truyền đạt kiến thức"
                    ],
                    "typical_experience_years": {
                        "min": 3.5,
                        "max": 5
                    }
                },
                "lead": {
                    "summary": (
                        "Định hướng kỹ thuật, con người và chất lượng "
                        "cho toàn bộ nhóm frontend."
                    ),
                    "core_skills": [
                        "Technical leadership",
                        "Architecture",
                        "People development"
                    ],
                    "technical_skills": [
                        "Engineering strategy",
                        "System architecture",
                        "Delivery management",
                        "Technical governance"
                    ],
                    "tools": [
                        "Planning tools",
                        "CI/CD",
                        "Monitoring"
                    ],
                    "responsibilities": [
                        "Định hướng kỹ thuật cho nhóm",
                        "Phân bổ công việc",
                        "Đánh giá rủi ro",
                        "Phối hợp với các nhóm khác"
                    ],
                    "expected_knowledge": [
                        "Chiến lược kỹ thuật",
                        "Quản lý delivery",
                        "Quản lý rủi ro",
                        "Phát triển nhân sự"
                    ],
                    "expected_achievements": [
                        "Dẫn dắt nhiều dự án",
                        "Xây dựng quy trình kỹ thuật",
                        "Phát triển năng lực nhóm"
                    ],
                    "soft_skills": [
                        "Lãnh đạo",
                        "Đàm phán",
                        "Quản lý xung đột"
                    ],
                    "typical_experience_years": {
                        "min": 5,
                        "max": None
                    }
                }
            }
        }

    def _backend_framework(self) -> Dict[str, Any]:
        return self._generic_software_framework(
            role="Backend Developer",
            aliases=[
                "Backend Engineer",
                "Back-end Developer",
                "Server-side Developer"
            ],
            core_skills=[
                "Một ngôn ngữ backend",
                "Database",
                "REST API",
                "Authentication",
                "Git"
            ],
            technical_skills=[
                "API design",
                "Database design",
                "Error handling",
                "Testing",
                "Security",
                "Caching"
            ]
        )

    def _mobile_framework(self) -> Dict[str, Any]:
        return self._generic_software_framework(
            role="Mobile Developer",
            aliases=[
                "Mobile Engineer",
                "Android Developer",
                "iOS Developer",
                "Mobile App Developer"
            ],
            core_skills=[
                "Mobile programming",
                "UI development",
                "API integration",
                "Git"
            ],
            technical_skills=[
                "Application lifecycle",
                "Local storage",
                "Networking",
                "Testing",
                "Performance",
                "App deployment"
            ]
        )

    def _qa_framework(self) -> Dict[str, Any]:
        return self._generic_software_framework(
            role="QA Engineer",
            aliases=[
                "Quality Assurance Engineer",
                "Software Tester",
                "Test Engineer",
                "QA/QC Engineer",
                "QC Engineer"
            ],
            core_skills=[
                "Test case design",
                "Functional testing",
                "Regression testing",
                "Bug reporting"
            ],
            technical_skills=[
                "Test planning",
                "API testing",
                "Automation testing",
                "Test documentation",
                "Risk-based testing"
            ]
        )

    def _data_scientist_framework(self) -> Dict[str, Any]:
        return self._generic_software_framework(
            role="Data Scientist",
            aliases=[
                "Data Science Specialist",
                "Applied Data Scientist"
            ],
            core_skills=[
                "Python",
                "SQL",
                "Statistics",
                "Data visualization",
                "Data cleaning"
            ],
            technical_skills=[
                "Machine learning",
                "Exploratory data analysis",
                "Hypothesis testing",
                "Feature engineering",
                "Model evaluation",
                "Storytelling with data"
            ]
        )

    def _data_engineer_framework(self) -> Dict[str, Any]:
        return self._generic_software_framework(
            role="Data Engineer",
            aliases=[
                "Data Engineering Specialist"
            ],
            core_skills=[
                "SQL",
                "Python",
                "Database",
                "Data pipelines"
            ],
            technical_skills=[
                "ETL",
                "Data modeling",
                "Distributed processing",
                "Data quality",
                "Pipeline monitoring"
            ]
        )

    def _ml_engineer_framework(self) -> Dict[str, Any]:
        return self._generic_software_framework(
            role="Machine Learning Engineer",
            aliases=[
                "ML Engineer",
                "AI Engineer",
                "AI/Machine Learning Engineer",
                "AI Machine Learning Engineer"
            ],
            core_skills=[
                "Python",
                "Machine learning",
                "Statistics",
                "Data preprocessing"
            ],
            technical_skills=[
                "Model training",
                "Model evaluation",
                "Feature engineering",
                "Deployment",
                "Model monitoring"
            ]
        )

    def _devops_framework(self) -> Dict[str, Any]:
        return self._generic_software_framework(
            role="DevOps Engineer",
            aliases=[
                "DevOps Specialist",
                "Platform Engineer"
            ],
            core_skills=[
                "Linux",
                "Networking",
                "Git",
                "CI/CD"
            ],
            technical_skills=[
                "Containerization",
                "Infrastructure as code",
                "Cloud platforms",
                "Monitoring",
                "Deployment automation"
            ]
        )

    def _cloud_engineer_framework(self) -> Dict[str, Any]:
        return self._generic_software_framework(
            role="Cloud Engineer",
            aliases=[
                "Cloud Infrastructure Engineer",
                "Cloud Solutions Engineer",
                "Cloud Architect"
            ],
            core_skills=[
                "Cloud platforms (AWS/Azure/GCP)",
                "Networking",
                "Linux",
                "Infrastructure as code"
            ],
            technical_skills=[
                "Cloud architecture",
                "Cost optimization",
                "Security & IAM",
                "Auto-scaling",
                "Disaster recovery",
                "Cloud monitoring"
            ]
        )

    def _business_analyst_framework(self) -> Dict[str, Any]:
        return self._generic_software_framework(
            role="Business Analyst",
            aliases=[
                "IT Business Analyst",
                "System Analyst"
            ],
            core_skills=[
                "Requirement gathering",
                "Business process analysis",
                "Documentation",
                "Communication"
            ],
            technical_skills=[
                "Use case",
                "User story",
                "Process modeling",
                "Requirement validation",
                "Stakeholder analysis"
            ]
        )

    def _uiux_framework(self) -> Dict[str, Any]:
        return self._generic_software_framework(
            role="UI/UX Designer",
            aliases=[
                "UX Designer",
                "UI Designer",
                "Product Designer"
            ],
            core_skills=[
                "User research",
                "Wireframing",
                "Prototyping",
                "Visual design"
            ],
            technical_skills=[
                "Information architecture",
                "Usability testing",
                "Design systems",
                "Interaction design",
                "Accessibility"
            ]
        )

    def _cybersecurity_framework(self) -> Dict[str, Any]:
        return self._generic_software_framework(
            role="Cybersecurity Engineer",
            aliases=[
                "Security Engineer",
                "Information Security Engineer"
            ],
            core_skills=[
                "Networking",
                "Linux",
                "Security fundamentals",
                "Risk awareness"
            ],
            technical_skills=[
                "Vulnerability assessment",
                "Security monitoring",
                "Incident response",
                "Access control",
                "Security testing"
            ]
        )

    def _sysadmin_framework(self) -> Dict[str, Any]:
        return self._generic_software_framework(
            role="System Administrator",
            aliases=[
                "Sys Admin",
                "IT System Administrator",
                "Systems Administrator"
            ],
            core_skills=[
                "Linux",
                "Windows Server",
                "Networking",
                "Shell scripting"
            ],
            technical_skills=[
                "Server maintenance",
                "Backup & recovery",
                "System monitoring",
                "User & access management",
                "Patch management",
                "Virtualization"
            ]
        )

    def _network_engineer_framework(self) -> Dict[str, Any]:
        return self._generic_software_framework(
            role="Network Engineer",
            aliases=[
                "Network Administrator",
                "Network Systems Engineer"
            ],
            core_skills=[
                "Networking fundamentals (TCP/IP)",
                "Routing & switching",
                "Firewall configuration",
                "Network troubleshooting"
            ],
            technical_skills=[
                "VPN",
                "Network security",
                "Network monitoring",
                "LAN/WAN design",
                "Wireless networking",
                "Load balancing"
            ]
        )

    def _dba_framework(self) -> Dict[str, Any]:
        return self._generic_software_framework(
            role="Database Administrator",
            aliases=[
                "DBA",
                "Database Engineer",
                "Database Manager"
            ],
            core_skills=[
                "SQL",
                "Database design",
                "Backup & recovery",
                "Database security"
            ],
            technical_skills=[
                "Performance tuning",
                "Query optimization",
                "Replication",
                "High availability",
                "Data migration",
                "Monitoring"
            ]
        )

    def _generic_software_framework(
        self,
        role: str,
        aliases: List[str],
        core_skills: List[str],
        technical_skills: List[str]
    ) -> Dict[str, Any]:
        """
        Tạo framework cơ bản cho các nghề nghiệp.

        Đây là dữ liệu khởi đầu. Sau này có thể tách thành
        file JSON/YAML hoặc database.
        """

        return {
            "role": role,
            "aliases": aliases,
            "description": (
                f"Bộ tiêu chuẩn năng lực cho vị trí {role}."
            ),
            "levels": {
                "intern": {
                    "summary": "Có kiến thức nền tảng và dự án học tập.",
                    "core_skills": core_skills,
                    "technical_skills": technical_skills,
                    "tools": ["Git", "GitHub"],
                    "responsibilities": [
                        "Hoàn thành nhiệm vụ được hướng dẫn",
                        "Thực hiện dự án học tập",
                        "Ghi nhận và sửa lỗi cơ bản"
                    ],
                    "expected_knowledge": core_skills,
                    "expected_achievements": [
                        "Có dự án học tập",
                        "Có sản phẩm hoặc bài thực hành"
                    ],
                    "soft_skills": [
                        "Tự học",
                        "Làm việc nhóm"
                    ],
                    "typical_experience_years": {
                        "min": 0,
                        "max": 0
                    }
                },
                "fresher": {
                    "summary": "Có thể thực hiện nhiệm vụ cơ bản dưới sự hướng dẫn.",
                    "core_skills": core_skills,
                    "technical_skills": technical_skills,
                    "tools": ["Git", "GitHub"],
                    "responsibilities": [
                        "Thực hiện nhiệm vụ được giao",
                        "Viết tài liệu và báo cáo",
                        "Sửa lỗi cơ bản"
                    ],
                    "expected_knowledge": core_skills,
                    "expected_achievements": [
                        "Có dự án thực tế hoặc cá nhân",
                        "Có thể hoàn thành một nhiệm vụ độc lập"
                    ],
                    "soft_skills": [
                        "Giao tiếp",
                        "Quản lý thời gian",
                        "Giải quyết vấn đề"
                    ],
                    "typical_experience_years": {
                        "min": 0,
                        "max": 1
                    }
                },
                "junior": {
                    "summary": "Có thể thực hiện công việc độc lập ở phạm vi vừa phải.",
                    "core_skills": core_skills,
                    "technical_skills": technical_skills,
                    "tools": ["Git", "GitHub", "Testing tools"],
                    "responsibilities": [
                        "Thực hiện công việc độc lập",
                        "Phân tích và sửa lỗi",
                        "Phối hợp với thành viên khác"
                    ],
                    "expected_knowledge": technical_skills,
                    "expected_achievements": [
                        "Có kinh nghiệm với dự án thực tế",
                        "Có đóng góp rõ ràng cho sản phẩm"
                    ],
                    "soft_skills": [
                        "Chủ động",
                        "Làm việc nhóm",
                        "Tư duy phản biện"
                    ],
                    "typical_experience_years": {
                        "min": 1,
                        "max": 2.5
                    }
                },
                "middle": {
                    "summary": "Có khả năng giải quyết vấn đề và thiết kế giải pháp.",
                    "core_skills": core_skills,
                    "technical_skills": technical_skills,
                    "tools": [
                        "Git",
                        "CI/CD",
                        "Monitoring"
                    ],
                    "responsibilities": [
                        "Thiết kế giải pháp",
                        "Review công việc",
                        "Hỗ trợ thành viên junior"
                    ],
                    "expected_knowledge": technical_skills,
                    "expected_achievements": [
                        "Dẫn dắt một module",
                        "Giải quyết vấn đề phức tạp",
                        "Cải thiện chất lượng sản phẩm"
                    ],
                    "soft_skills": [
                        "Mentoring",
                        "Ra quyết định",
                        "Giao tiếp kỹ thuật"
                    ],
                    "typical_experience_years": {
                        "min": 2.5,
                        "max": 3.5
                    }
                },
                "senior": {
                    "summary": "Có khả năng định hướng kỹ thuật và chịu trách nhiệm lớn.",
                    "core_skills": core_skills,
                    "technical_skills": technical_skills,
                    "tools": [
                        "CI/CD",
                        "Monitoring",
                        "Architecture tools"
                    ],
                    "responsibilities": [
                        "Định hướng kỹ thuật",
                        "Đánh giá giải pháp",
                        "Thiết lập tiêu chuẩn",
                        "Hỗ trợ phát triển đội ngũ"
                    ],
                    "expected_knowledge": technical_skills,
                    "expected_achievements": [
                        "Dẫn dắt dự án hoặc hệ thống",
                        "Có ảnh hưởng rõ ràng đến chất lượng sản phẩm"
                    ],
                    "soft_skills": [
                        "Lãnh đạo",
                        "Định hướng",
                        "Truyền đạt kiến thức"
                    ],
                    "typical_experience_years": {
                        "min": 3.5,
                        "max": 5
                    }
                },
                "lead": {
                    "summary": "Định hướng kỹ thuật, quy trình và con người.",
                    "core_skills": core_skills,
                    "technical_skills": technical_skills,
                    "tools": [
                        "Planning tools",
                        "CI/CD",
                        "Monitoring"
                    ],
                    "responsibilities": [
                        "Định hướng nhóm",
                        "Quản lý rủi ro",
                        "Phân bổ công việc",
                        "Phối hợp với các bên liên quan"
                    ],
                    "expected_knowledge": technical_skills,
                    "expected_achievements": [
                        "Dẫn dắt nhiều dự án",
                        "Xây dựng quy trình",
                        "Phát triển năng lực nhóm"
                    ],
                    "soft_skills": [
                        "Lãnh đạo",
                        "Đàm phán",
                        "Quản lý xung đột"
                    ],
                    "typical_experience_years": {
                        "min": 5,
                        "max": None
                    }
                }
            }
        }


def get_career_framework(
    role: str,
    level: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """
    Hàm tiện ích để sử dụng từ module khác.
    """

    framework = CareerFramework()

    return framework.get_framework(
        role=role,
        level=level
    )