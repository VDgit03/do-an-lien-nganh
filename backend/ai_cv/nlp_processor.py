import re


class SkillNormalizer:

    def __init__(self):
        """
        Dictionary dùng để chuẩn hóa skill.

        Key:
            Các cách viết có thể xuất hiện trong CV hoặc JD.

        Value:
            Tên skill chuẩn.
        """

        self.skill_taxonomy = {

            # =========================
            # Programming Languages
            # =========================

            "python": "Python",
            "python3": "Python",
            "py": "Python",

            "java": "Java",

            "javascript": "JavaScript",
            "javascript es6": "JavaScript",
            "js": "JavaScript",

            "typescript": "TypeScript",
            "ts": "TypeScript",

            "c": "C",
            "c++": "C++",
            "cpp": "C++",

            "c#": "C#",
            "csharp": "C#",

            "php": "PHP",
            "ruby": "Ruby",
            "go": "Go",
            "golang": "Go",
            "kotlin": "Kotlin",
            "swift": "Swift",

            # =========================
            # Web
            # =========================

            "html": "HTML",
            "html5": "HTML",

            "css": "CSS",
            "css3": "CSS",

            "bootstrap": "Bootstrap",

            "tailwind": "Tailwind CSS",
            "tailwind css": "Tailwind CSS",

            "graphql": "GraphQL",

            "sass": "Sass",
            "scss": "Sass",

            # =========================
            # Frontend
            # =========================

            "react": "React",
            "reactjs": "React",

            # FIX: thiếu mục này khiến "React Native" bị nhận nhầm thành
            # "React" (extract_skills_from_text khớp từ "react" bên trong).
            "react native": "React Native",
            "react-native": "React Native",

            "vue": "Vue.js",
            "vuejs": "Vue.js",

            "angular": "Angular",
            "angularjs": "AngularJS",

            "next.js": "Next.js",
            "nextjs": "Next.js",

            # =========================
            # Backend
            # =========================

            "node": "Node.js",
            "nodejs": "Node.js",
            "node.js": "Node.js",

            "express": "Express.js",
            "expressjs": "Express.js",
            "express.js": "Express.js",

            "spring": "Spring",
            "spring boot": "Spring Boot",
            "springboot": "Spring Boot",

            "django": "Django",
            "flask": "Flask",
            "fastapi": "FastAPI",
            "laravel": "Laravel",

            ".net": ".NET",
            "dotnet": ".NET",

            # =========================
            # Database
            # =========================

            "sql": "SQL",

            "mysql": "MySQL",
            "postgresql": "PostgreSQL",
            "postgres": "PostgreSQL",

            "mongodb": "MongoDB",
            "mongo": "MongoDB",

            "redis": "Redis",

            "oracle": "Oracle",

            "sqlite": "SQLite",

            "elasticsearch": "Elasticsearch",

            # =========================
            # Cloud
            # =========================

            "aws": "AWS",
            "amazon web services": "AWS",

            "azure": "Microsoft Azure",
            "microsoft azure": "Microsoft Azure",

            "gcp": "Google Cloud",
            "google cloud": "Google Cloud",
            "google cloud platform": "Google Cloud",

            # =========================
            # DevOps
            # =========================

            "docker": "Docker",

            "kubernetes": "Kubernetes",
            "k8s": "Kubernetes",

            "jenkins": "Jenkins",

            "ci/cd": "CI/CD",
            "cicd": "CI/CD",
            "continuous integration": "CI/CD",

            "linux": "Linux",
            "unix": "Unix",

            "terraform": "Terraform",
            "ansible": "Ansible",

            "git": "Git",
            "github": "GitHub",
            "gitlab": "GitLab",
            "bitbucket": "Bitbucket",

            # =========================
            # Data / AI
            # =========================

            "machine learning": "Machine Learning",
            "machine-learning": "Machine Learning",
            "ml": "Machine Learning",

            "deep learning": "Deep Learning",
            "deep-learning": "Deep Learning",
            "dl": "Deep Learning",

            "natural language processing": "NLP",
            "nlp": "NLP",

            "computer vision": "Computer Vision",

            "data analysis": "Data Analysis",
            "data analytics": "Data Analysis",

            "pandas": "Pandas",
            "numpy": "NumPy",

            "tensorflow": "TensorFlow",
            "pytorch": "PyTorch",
            "scikit-learn": "Scikit-learn",
            "sklearn": "Scikit-learn",

            "power bi": "Power BI",
            "powerbi": "Power BI",
            "tableau": "Tableau",

            # =========================
            # Tools
            # =========================

            "visual studio code": "VS Code",
            "vs code": "VS Code",
            "vscode": "VS Code",

            "intellij": "IntelliJ IDEA",
            "intellij idea": "IntelliJ IDEA",

            "postman": "Postman",

            "figma": "Figma",

            "jira": "JIRA",
            "confluence": "Confluence",

            "excel": "Excel",
            "microsoft excel": "Excel",

            "selenium": "Selenium",

            # =========================
            # Methodologies
            # =========================

            "agile": "Agile",
            "scrum": "Scrum",
            "kanban": "Kanban",

            "rest": "REST API",
            "rest api": "REST API",
            "restful api": "REST API",

            "api": "API",

            "unit testing": "Unit Testing",
            "unit test": "Unit Testing",

            "microservices": "Microservices",
        }

    # =========================================================
    # 1. NORMALIZE SKILL
    # =========================================================

    def normalize_skill(self, skill):
        """
        Chuẩn hóa một skill.

        Ví dụ:

            python
                -> Python

            Python3
                -> Python

            ReactJS
                -> React
        """

        if not skill:
            return None

        skill = str(skill).strip()

        if not skill:
            return None

        # Chuẩn hóa khoảng trắng
        skill = re.sub(r"\s+", " ", skill)

        # lowercase để lookup
        key = skill.lower()

        return self.skill_taxonomy.get(key)

    # =========================================================
    # 2. NORMALIZE SKILL LIST
    # =========================================================

    def normalize_skill_list(self, skills):
        """
        Chuẩn hóa một danh sách skill.

        Input:
            ["Python", "python3", "ReactJS"]

        Output:
            ["Python", "React"]
        """

        if not skills:
            return []

        result = []

        for skill in skills:

            normalized = self.normalize_skill(skill)

            if normalized and normalized not in result:
                result.append(normalized)

        return result

    # =========================================================
    # 3. EXTRACT SKILL FROM TEXT
    # =========================================================

    def extract_skills_from_text(self, text):
        """
        Tìm skill trong một đoạn text.

        Dùng cho:
            project description
            experience description
            role
            technology
            job description (JD)
        """

        if not text:
            return []

        text = str(text)

        # Tìm TẤT CẢ match trước, sau đó chọn match không chồng lấn.
        # Điều này tránh trường hợp:
        #     "Spring Boot" -> ["Spring Boot", "Spring"]
        # và giữ lại cụm skill cụ thể hơn.
        aliases = sorted(
            self.skill_taxonomy.keys(),
            key=len,
            reverse=True
        )

        matches = []

        for alias in aliases:
            pattern = (
                r"(?<![a-zA-Z0-9+#.])"
                + re.escape(alias)
                + r"(?![a-zA-Z0-9+#])"
            )

            for match in re.finditer(
                pattern,
                text,
                re.IGNORECASE
            ):
                matches.append({
                    "start": match.start(),
                    "end": match.end(),
                    "length": match.end() - match.start(),
                    "alias": alias,
                    "skill": self.skill_taxonomy[alias]
                })

        # Match dài hơn được ưu tiên; nếu cùng độ dài thì xuất hiện trước.
        matches.sort(
            key=lambda item: (
                -item["length"],
                item["start"]
            )
        )

        selected = []

        for match in matches:
            overlaps = any(
                match["start"] < item["end"]
                and match["end"] > item["start"]
                for item in selected
            )

            if not overlaps:
                selected.append(match)

        # Trả về theo đúng thứ tự xuất hiện trong text.
        selected.sort(key=lambda item: item["start"])

        found = []

        for item in selected:
            skill = item["skill"]

            if skill not in found:
                found.append(skill)

        return found

    # =========================================================
    # 4. EXTRACT FROM SKILLS SECTION
    # =========================================================

    def extract_from_skills_section(self, skills):
        """
        Lấy skill trực tiếp từ:

            cv["skills"]

        structure_cv.py đã parse thành list.
        """

        if not skills:
            return []

        result = []

        for skill in skills:

            # Trường hợp:
            # "Python"
            normalized = self.normalize_skill(skill)

            if normalized:

                if normalized not in result:
                    result.append(normalized)

                continue

            # Trường hợp skill chưa có alias
            # nhưng có thể chứa nhiều skill.
            extracted = self.extract_skills_from_text(skill)

            for item in extracted:

                if item not in result:
                    result.append(item)

        return result

    # =========================================================
    # 5. EXTRACT FROM PROJECT
    # =========================================================

    def extract_from_projects_section(self, projects):
        """
        structure_cv.py tạo project dạng:

        {
            "date": "...",
            "name": "...",
            "role": "...",
            "description": [...],
            "technologies": [...],
            "repository": "..."
        }
        """

        if not projects:
            return []

        result = []

        for project in projects:

            if not isinstance(project, dict):
                continue

            # ---------------------------------
            # technologies
            # ---------------------------------

            technologies = project.get(
                "technologies",
                []
            )

            if technologies:

                for technology in technologies:

                    normalized = self.normalize_skill(
                        technology
                    )

                    if normalized:

                        if normalized not in result:
                            result.append(normalized)

                    else:

                        extracted = (
                            self.extract_skills_from_text(
                                technology
                            )
                        )

                        for skill in extracted:

                            if skill not in result:
                                result.append(skill)

            # ---------------------------------
            # name
            # ---------------------------------

            name = project.get(
                "name",
                ""
            )

            for skill in self.extract_skills_from_text(
                name
            ):

                if skill not in result:
                    result.append(skill)

            # ---------------------------------
            # role
            # ---------------------------------

            role = project.get(
                "role",
                ""
            )

            for skill in self.extract_skills_from_text(
                role
            ):

                if skill not in result:
                    result.append(skill)

            # ---------------------------------
            # description
            # ---------------------------------

            description = project.get(
                "description",
                []
            )

            if isinstance(description, list):

                description = " ".join(
                    str(item)
                    for item in description
                )

            elif not isinstance(description, str):

                description = ""

            for skill in self.extract_skills_from_text(
                description
            ):

                if skill not in result:
                    result.append(skill)

        return result

    # =========================================================
    # 6. EXTRACT FROM EXPERIENCE
    # =========================================================

    def extract_from_experience_section(self, experience):
        """
        structure_cv.py hiện tại lưu experience
        dưới dạng list các dòng raw:

            cv["experience"] = [
                "...",
                "...",
                "..."
            ]

        nhưng hàm này cũng hỗ trợ luôn dạng dict
        phòng khi experience được structured lại sau này.
        """

        if not experience:
            return []

        result = []

        for item in experience:

            # ---------------------------------
            # Nếu experience là string
            # ---------------------------------

            if isinstance(item, str):

                extracted = (
                    self.extract_skills_from_text(item)
                )

                for skill in extracted:

                    if skill not in result:
                        result.append(skill)

            # ---------------------------------
            # Nếu sau này experience được
            # structured thành dict
            # ---------------------------------

            elif isinstance(item, dict):

                for key in [
                    "position",
                    "title",
                    "role",
                    "description",
                    "responsibilities",
                    "technologies",
                    "skills"
                ]:

                    value = item.get(key)

                    if not value:
                        continue

                    if isinstance(value, list):

                        value = " ".join(
                            str(x)
                            for x in value
                        )

                    else:

                        value = str(value)

                    extracted = (
                        self.extract_skills_from_text(
                            value
                        )
                    )

                    for skill in extracted:

                        if skill not in result:
                            result.append(skill)

        return result

    # =========================================================
    # 7. EXTRACT FROM CERTIFICATIONS
    # =========================================================

    def extract_from_certifications_section(self, certifications):
        """
        structure_cv.py trả certifications dạng list string, vd:

            ["AWS Certified Solutions Architect", "Oracle Java SE 11"]

        Tên chứng chỉ thường chứa tên công nghệ hữu ích cho matching.
        """

        if not certifications:
            return []

        result = []

        for item in certifications:

            for skill in self.extract_skills_from_text(str(item)):

                if skill not in result:
                    result.append(skill)

        return result

    # =========================================================
    # 8. EXTRACT FROM SUMMARY
    # =========================================================

    def extract_from_summary_section(self, summary):
        """
        cv["summary"] là một đoạn text tự do, có thể chứa tên
        công nghệ/kỹ năng nổi bật mà ứng viên tự giới thiệu.
        """

        if not summary:
            return []

        return self.extract_skills_from_text(str(summary))

    # =========================================================
    # 9. EXTRACT FROM OTHER SECTIONS
    # =========================================================

    def extract_from_other_sections(self, other):
        """
        cv["other"] là list các dict:

            {"section": "Courses", "content": "..."}
            {"section": "Publications", "content": "..."}

        Các mục như courses/training/certification-like content
        thường chứa tên công nghệ.
        """

        if not other:
            return []

        result = []

        for item in other:

            if not isinstance(item, dict):
                continue

            content = item.get("content", "")

            for skill in self.extract_skills_from_text(content):

                if skill not in result:
                    result.append(skill)

        return result

    # =========================================================
    # 10. STANDARDIZE CV SKILLS
    #
    # Đây là điểm kết thúc của nlp_processor trong pipeline:
    #
    #     structure_cv (đọc & chia CV thành section)
    #             ↓
    #     nlp_processor / SkillNormalizer (hiểu nội dung + chuẩn hóa)
    #             ↓
    #     standardized_skills   <-- hàm này trả về đúng cái này
    #             ↓
    #     CV ↔ JD Matching (thuộc module khác, xem cv_jd_matcher.py)
    # =========================================================

    def standardize_cv_skills(self, cv):
        """
        Chuẩn hóa skill cho toàn bộ CV.

        Skill được tổng hợp từ skills, projects, experience,
        certifications và other.

        Summary KHÔNG được dùng để tạo skill vì Summary có mục đích
        mô tả bản thân và định hướng nghề nghiệp của ứng viên.
        """
        if not isinstance(cv, dict):
            return {"skills": []}

        all_skills = []

        sources = [
            self.extract_from_skills_section(cv.get("skills", [])),
            self.extract_from_projects_section(cv.get("projects", [])),
            self.extract_from_experience_section(cv.get("experience", [])),
            self.extract_from_certifications_section(cv.get("certifications", [])),
            self.extract_from_other_sections(cv.get("other", [])),
        ]

        for skill_list in sources:
            for skill in skill_list:
                if skill and skill not in all_skills:
                    all_skills.append(skill)

        return {"skills": all_skills}

    # =========================================================
    # 11. GENERIC TEXT HELPERS
    # =========================================================

    def _to_text(self, value):
        """Đưa string/list/dict đơn giản về text để NLP xử lý."""
        if value is None:
            return ""

        if isinstance(value, str):
            return value.strip()

        if isinstance(value, list):
            return " ".join(
                str(item).strip()
                for item in value
                if str(item).strip()
            )

        if isinstance(value, dict):
            return " ".join(
                str(v).strip()
                for v in value.values()
                if v is not None and str(v).strip()
            )

        return str(value).strip()

    def _extract_action_verbs(self, text):
        """
        Trích xuất action verbs và chuẩn hóa về dạng nguyên mẫu.
        Kết quả giữ theo thứ tự xuất hiện trong CV.
        """
        if not text:
            return []

        action_map = {
            "developed": "develop", "develop": "develop", "developing": "develop",
            "built": "build", "build": "build",
            "designed": "design", "design": "design",
            "implemented": "implement", "implement": "implement",
            "created": "create", "create": "create",
            "maintained": "maintain", "maintain": "maintain",
            "deployed": "deploy", "deploy": "deploy",
            "tested": "test", "test": "test",
            "optimized": "optimize", "optimize": "optimize",
            "improved": "improve", "improve": "improve",
            "managed": "manage", "manage": "manage",
            "analyzed": "analyze", "analyze": "analyze",
            "integrated": "integrate", "integrate": "integrate",
            "configured": "configure", "configure": "configure",
            "automated": "automate", "automate": "automate",
            "worked": "work", "working": "work",
            "led": "lead", "lead": "lead",
            "supported": "support", "support": "support",
        }

        matches = []
        for verb, base_form in action_map.items():
            pattern = r"(?<![a-zA-Z])" + re.escape(verb) + r"(?![a-zA-Z])"
            for match in re.finditer(pattern, text.lower()):
                matches.append((match.start(), base_form))

        matches.sort(key=lambda item: item[0])

        found = []
        for _, base_form in matches:
            if base_form not in found:
                found.append(base_form)

        return found

    def _extract_metrics(self, text):
        """
        Lấy một số evidence định lượng đơn giản:
        20%, 2 years, 5 members, 10 users, ...
        """
        if not text:
            return []

        patterns = [
            r"\b\d+(?:\.\d+)?\s*%",
            r"\b\d+(?:\.\d+)?\s*(?:years?|months?)\b",
            r"\b\d+(?:\.\d+)?\s*[- ]?(?:users?|developers?|members?|projects?)\b"
        ]

        result = []

        for pattern in patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                value = re.sub(r"\s+", " ", match.group(0).strip())
                if value not in result:
                    result.append(value)

        return result

    # =========================================================
    # 12. ANALYZE EXPERIENCE
    # =========================================================

    def analyze_experience(self, experience):
        """
        Không chỉ lấy skill.
        Với mỗi experience, trả về:
            - text
            - skills
            - actions
            - metrics

        BUG CŨ: hàm này chỉ trả về "text"/"skills"/"actions"/"metrics" và
        loại bỏ hoàn toàn các field gốc như "date"/"position"/"company" mà
        structure_cv.py đã trích xuất được. Hậu quả là candidate_profile.py
        không bao giờ tìm thấy start_date/end_date để tính
        total_experience_years (luôn ra 0.0), và cũng không lấy được
        "position" để xác định current_role/roles.

        Fix: giữ lại các field gốc (date/position/company, hoặc
        start_date/end_date nếu có) giống cách analyze_projects() đang làm,
        đồng thời vẫn bổ sung skills/actions/metrics rút ra từ text.
        """
        if not experience:
            return []

        result = []

        for item in experience:
            if isinstance(item, dict):
                # Ghép position/company/description thành text sạch để
                # phân tích NLP, thay vì join tất cả values() của dict một
                # cách "thô" (từng khiến description dạng list bị in ra như
                # repr Python, ví dụ "['Built ...', 'Improved ...']").
                position = self._to_text(
                    item.get("position")
                    or item.get("title")
                    or item.get("role")
                    or item.get("job_title")
                    or ""
                )
                company = self._to_text(
                    item.get("company")
                    or item.get("organization")
                    or ""
                )
                description_text = self._to_text(
                    item.get("description", "")
                )

                text = " ".join(
                    part
                    for part in (position, company, description_text)
                    if part
                )

                if not text:
                    text = self._to_text(item)
            else:
                text = self._to_text(item)

            if not text:
                continue

            entry = {
                "text": text,
                "skills": self.extract_skills_from_text(text),
                "actions": self._extract_action_verbs(text),
                "metrics": self._extract_metrics(text)
            }

            if isinstance(item, dict):
                # Giữ lại các field gốc để candidate_profile.py có thể
                # tính total_experience_years và xác định role/company.
                for key in (
                    "date",
                    "position",
                    "title",
                    "role",
                    "job_title",
                    "company",
                    "organization",
                    "start_date",
                    "end_date",
                    "from",
                    "to",
                    "start",
                    "end",
                    "description",
                ):
                    if key in item:
                        entry[key] = item[key]

            result.append(entry)

        return result

    # =========================================================
    # 13. ANALYZE PROJECTS
    # =========================================================

    def analyze_projects(self, projects):
        """
        Giữ cấu trúc project của structure_cv.py và bổ sung NLP:
            - skills/technologies
            - actions trong description
            - metrics trong description
        """
        if not projects:
            return []

        result = []

        for project in projects:
            if not isinstance(project, dict):
                continue

            description = self._to_text(project.get("description", ""))
            name = self._to_text(project.get("name", ""))
            role = self._to_text(project.get("role", ""))
            technologies = project.get("technologies", [])

            # Technologies nên phản ánh công nghệ được khai báo cho project.
            # Không lấy toàn bộ description/name/role để tránh biến mọi
            # từ khóa xuất hiện trong mô tả thành technology.
            unique_skills = self.extract_from_skills_section(technologies)

            # Nếu structure_cv.py chưa nhận diện được technologies,
            # mới fallback sang text của project.
            if not unique_skills:
                unique_skills = self.extract_skills_from_text(
                    self._to_text(technologies)
                )

            result.append({
                "date": project.get("date", ""),
                "name": name,
                "role": role,
                "technologies": unique_skills,
                "description": project.get("description", []),
                "actions": self._extract_action_verbs(description),
                "metrics": self._extract_metrics(description),
                "repository": self._normalize_repository(
                    project.get("repository", "")
                )
            })

        return result

    # =========================================================
    # 14. ANALYZE SUMMARY
    # =========================================================

    def analyze_summary(self, summary):
        """
        Summary là phần giới thiệu và định hướng nghề nghiệp của ứng viên.

        Chỉ giữ text, không extract skills/actions/metrics.
        Điều này giúp Summary được dùng riêng cho profile/recommendation
        mà không bị trộn với technical skills.
        """
        return {
            "text": self._to_text(summary)
        }

    # =========================================================
    # REPOSITORY NORMALIZATION
    # =========================================================

    def _normalize_repository(self, repository):
        """
        Đưa repository về URL thuần.
        Ví dụ Markdown link -> URL.
        """
        if not repository:
            return ""

        value = str(repository).strip()
        markdown_match = re.fullmatch(r"\[([^\]]+)\]\(([^)]+)\)", value)

        if markdown_match:
            return markdown_match.group(2).strip()

        return value

    # =========================================================
    # 15. ANALYZE CERTIFICATIONS
    # =========================================================

    def analyze_certifications(self, certifications):
        """Giữ tên chứng chỉ và skill/công nghệ được nhận diện."""
        if not certifications:
            return []

        result = []

        for item in certifications:
            text = self._to_text(item)

            if not text:
                continue

            result.append({
                "name": text,
                "skills": self.extract_skills_from_text(text)
            })

        return result

    # =========================================================
    # 16. PROCESS WHOLE CV
    # =========================================================

    def process_cv(self, cv):
        """
        Entry point chính của NLP.

        Output cuối chỉ giữ những thông tin có ý nghĩa cho CV profile:
            - skills
            - summary
            - experience
            - projects
            - certifications

        skills_by_source là dữ liệu trung gian/debug nên không trả ra đây.
        """
        if not isinstance(cv, dict):
            return {
                "skills": [],
                "summary": {"text": ""},
                "experience": [],
                "projects": [],
                "certifications": []
            }

        standardized = self.standardize_cv_skills(cv)

        return {
            "skills": standardized["skills"],
            "summary": self.analyze_summary(cv.get("summary", "")),
            "experience": self.analyze_experience(cv.get("experience", [])),
            "projects": self.analyze_projects(cv.get("projects", [])),
            "certifications": self.analyze_certifications(
                cv.get("certifications", [])
            )
        }


# =============================================================
# BACKWARD-COMPATIBLE ALIAS
# =============================================================
# Có thể import:
#
#     from nlp_processor import SkillNormalizer
#
# hoặc:
#
#     from nlp_processor import CVNLPProcessor
#
# CVNLPProcessor dùng SkillNormalizer làm tầng chuẩn hóa skill.
# =============================================================

class CVNLPProcessor(SkillNormalizer):
    """
    Tên class rõ nghĩa hơn cho module NLP.
    SkillNormalizer vẫn được giữ để không phá code cũ.
    """
    pass

