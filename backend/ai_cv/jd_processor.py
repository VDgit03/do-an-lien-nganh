"""
jd_processor.py

Xử lý Job Description (JD) do người dùng cung cấp.

Nhiệm vụ duy nhất:
    JD (raw text hoặc structured dict)
        -> Generic JD Profile

Generic JD Profile là cấu trúc trung gian để:
    - career_intelligence.py phân tích yêu cầu của JD
    - cv_jd_matcher.py thực hiện CV-JD matching

Module này KHÔNG:
    - phân tích CV
    - xây career framework
    - chấm điểm ứng viên
    - so khớp CV
    - chứa logic nghiệp vụ nghề nghiệp
"""

import re
from typing import Any, Dict, List, Optional


class JDProcessor:
    """Chuẩn hóa raw JD hoặc structured JD thành Generic JD Profile."""

    REQUIRED_HEADINGS = {
        "requirements", "requirement", "required",
        "required skills", "required qualifications",
        "must have", "must-have", "mandatory",
        "you have", "what you need",
        "what we're looking for", "what we are looking for",
        # Vietnamese
        "yêu cầu", "yêu cầu công việc", "yêu cầu ứng viên",
        "yêu cầu kỹ năng", "yêu cầu chung", "kỹ năng yêu cầu",
        "kỹ năng cần có", "kỹ năng", "kỹ năng cần thiết",
        "các yêu cầu",
    }

    PREFERRED_HEADINGS = {
        "preferred", "preferred skills",
        "preferred qualifications", "nice to have",
        "nice-to-have", "bonus", "plus",
        # Vietnamese
        "ưu tiên", "điểm cộng", "là một lợi thế",
        "sẽ là lợi thế", "lợi thế", "ưu tiên ứng viên",
    }

    RESPONSIBILITY_HEADINGS = {
        "responsibilities", "responsibility",
        "what you will do", "what you'll do",
        "your responsibilities", "job responsibilities",
        # Vietnamese
        "mô tả công việc", "trách nhiệm", "trách nhiệm công việc",
        "công việc chính", "nhiệm vụ", "nhiệm vụ chính",
        "mô tả chi tiết", "công việc",
    }

    QUALIFICATION_HEADINGS = {
        "qualifications", "qualification",
        "education", "educational requirements",
        # Vietnamese
        "trình độ", "trình độ học vấn", "bằng cấp", "học vấn",
    }

    EXPERIENCE_HEADINGS = {
        "experience", "work experience", "professional experience",
        # Vietnamese
        "kinh nghiệm", "kinh nghiệm làm việc", "số năm kinh nghiệm",
    }

    # Từ khóa kỹ năng mềm (soft skill), nhận diện trực tiếp bằng tên hiển thị.
    SOFT_SKILL_KEYWORDS = {
        "teamwork": "Teamwork",
        "team work": "Teamwork",
        "communication": "Communication",
        "leadership": "Leadership",
        "problem solving": "Problem Solving",
        "critical thinking": "Critical Thinking",
        "time management": "Time Management",
        "adaptability": "Adaptability",
        "collaboration": "Collaboration",
        "làm việc nhóm": "Làm việc nhóm",
        "kỹ năng làm việc nhóm": "Làm việc nhóm",
        "giao tiếp": "Giao tiếp",
        "kỹ năng giao tiếp": "Giao tiếp",
        "lãnh đạo": "Lãnh đạo",
        "chịu được áp lực công việc": "Chịu áp lực công việc",
        "chịu áp lực công việc": "Chịu áp lực công việc",
        "chịu được áp lực": "Chịu áp lực công việc",
        "chịu áp lực": "Chịu áp lực công việc",
        "quản lý thời gian": "Quản lý thời gian",
        "tư duy phản biện": "Tư duy phản biện",
        "giải quyết vấn đề": "Giải quyết vấn đề",
        "chủ động trong công việc": "Chủ động trong công việc",
        "chủ động": "Chủ động trong công việc",
        "cẩn thận, tỉ mỉ": "Cẩn thận, tỉ mỉ",
        "cẩn thận": "Cẩn thận, tỉ mỉ",
        "tỉ mỉ": "Cẩn thận, tỉ mỉ",
        "trung thực": "Trung thực",
        "tinh thần trách nhiệm": "Tinh thần trách nhiệm",
        "tinh thần cầu tiến": "Tinh thần cầu tiến",
    }

    # Từ khóa ngoại ngữ.
    LANGUAGE_KEYWORDS = {
        "english": "English",
        "tiếng anh": "Tiếng Anh",
        "japanese": "Japanese",
        "tiếng nhật": "Tiếng Nhật",
        "chinese": "Chinese",
        "tiếng trung": "Tiếng Trung",
        "korean": "Korean",
        "tiếng hàn": "Tiếng Hàn",
        "french": "French",
        "tiếng pháp": "Tiếng Pháp",
        "german": "German",
        "tiếng đức": "Tiếng Đức",
    }

    def __init__(self, nlp_processor: Optional[Any] = None):
        # Tùy chọn: tái sử dụng taxonomy skill của nlp_processor.
        self.nlp = nlp_processor

    def process_jd(self, jd_input: Any, source: str = "auto") -> Dict[str, Any]:
        """
        Chuyển JD thành Generic JD Profile.

        jd_input:
            - raw JD string
            - structured job dict

        source:
            - auto
            - text
            - structured
        """
        if source == "text" or isinstance(jd_input, str):
            return self.parse_raw_jd(str(jd_input))

        if source == "structured" or isinstance(jd_input, dict):
            return self.parse_structured_jd(jd_input)

        return self._empty_profile()

    def parse_structured_jd(
        self,
        job: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Chuẩn hóa một JD dạng structured dict."""
        if not isinstance(job, dict):
            return self._empty_profile()

        description = job.get("job_description", {})
        requirements = job.get("requirements", {})

        if not isinstance(description, dict):
            description = {}
        if not isinstance(requirements, dict):
            requirements = {}

        profile = {
            "type": "job_description",
            "id": self._to_text(job.get("id") or job.get("job_id")),
            "title": self._to_text(
                job.get("job_title") or job.get("title")
            ),
            "company": self._to_text(
                job.get("company") or job.get("company_name")
            ),
            "level": self._to_text(
                job.get("job_level") or job.get("level")
            ),
            "employment_type": self._to_text(
                job.get("employment_type")
            ),
            "summary": self._to_text(description.get("summary")),
            "responsibilities": self._to_list(
                description.get("responsibilities")
            ),
            "requirements": [],
            "preferred_qualifications": [],
            "education": self._to_list(requirements.get("education")),
            "certifications": self._to_list(
                requirements.get("certifications")
            ),
            "domains": self._to_list(
                job.get("domain") or job.get("domains")
            ),
            "work_conditions": (
                job.get("work_conditions")
                if isinstance(job.get("work_conditions"), dict)
                else {}
            ),
            "benefits": self._to_list(job.get("benefits")),
            "recruitment_process": self._to_list(
                job.get("recruitment_process")
            ),
            "metadata": {
                "source": "structured",
                "source_schema": "structured_jd",
            },
        }

        self._add_structured_requirements(profile, requirements)

        for item in self._to_list(job.get("preferred_qualifications")):
            profile["preferred_qualifications"].append(
                self._make_requirement(
                    category=self._infer_requirement_category(item),
                    name=item,
                    importance="nice_to_have",
                    source_section="preferred_qualifications",
                )
            )

        profile["requirements"] = self._deduplicate_requirements(
            profile["requirements"]
        )
        profile["preferred_qualifications"] = (
            self._deduplicate_requirements(
                profile["preferred_qualifications"]
            )
        )

        return profile

    def parse_raw_jd(self, jd_text: str) -> Dict[str, Any]:
        """Phân tích JD dạng văn bản tự do thành Generic JD Profile."""
        text = str(jd_text or "").strip()

        if not text:
            return self._empty_profile()

        sections = self._split_sections(text)

        profile = {
            "type": "job_description",
            "id": "",
            "title": self._extract_title(text),
            "company": "",
            "level": "",
            "employment_type": "",
            "summary": self._extract_summary(text, sections),
            "responsibilities": sections["responsibilities"],
            "requirements": [],
            "preferred_qualifications": [],
            "education": [],
            "certifications": [],
            "domains": [],
            "work_conditions": {},
            "benefits": [],
            "recruitment_process": [],
            "metadata": {
                "source": "raw_text",
                "source_schema": "free_text",
            },
        }

        required_text = "\n".join(
            sections["required"]
            + sections["qualifications"]
            + sections["experience"]
        )

        skills = self._extract_skills_from_text(required_text)
        if not skills:
            skills = self._extract_skills_from_text(text)

        for skill in skills:
            profile["requirements"].append(
                self._make_requirement(
                    category=self._infer_requirement_category(skill),
                    name=skill,
                    source_section="raw_text",
                )
            )

        soft_skills = self._extract_keyword_matches(
            required_text, self.SOFT_SKILL_KEYWORDS
        )
        if not soft_skills:
            soft_skills = self._extract_keyword_matches(
                text, self.SOFT_SKILL_KEYWORDS
            )

        for soft_skill in soft_skills:
            profile["requirements"].append(
                self._make_requirement(
                    category="soft_skill",
                    name=soft_skill,
                    source_section="raw_text",
                )
            )

        languages = self._extract_keyword_matches(
            required_text, self.LANGUAGE_KEYWORDS
        )
        if not languages:
            languages = self._extract_keyword_matches(
                text, self.LANGUAGE_KEYWORDS
            )

        for language in languages:
            profile["requirements"].append(
                self._make_requirement(
                    category="language",
                    name=language,
                    source_section="raw_text",
                )
            )

        # Nếu section "required/qualifications/experience" không bắt được
        # (VD: JD tiếng Việt dùng heading chưa từng gặp), fallback sang
        # toàn bộ text để tránh mất yêu cầu kinh nghiệm.
        experience_req = self._parse_experience_from_text(required_text)
        if not experience_req:
            experience_req = self._parse_experience_from_text(text)
        if experience_req:
            profile["requirements"].append(experience_req)

        for item in self._extract_education(text):
            profile["education"].append(item)
            profile["requirements"].append(
                self._make_requirement(
                    category="education",
                    name=item,
                    source_section="raw_text",
                )
            )

        for item in self._extract_certifications(text):
            profile["certifications"].append(item)
            profile["requirements"].append(
                self._make_requirement(
                    category="certification",
                    name=item,
                    source_section="raw_text",
                )
            )

        preferred_text = "\n".join(sections["preferred"])
        preferred_items = self._extract_skills_from_text(preferred_text)
        candidates = preferred_items or sections["preferred"]

        for item in candidates:
            profile["preferred_qualifications"].append(
                self._make_requirement(
                    category=self._infer_requirement_category(item),
                    name=item,
                    importance="nice_to_have",
                    source_section="preferred",
                )
            )

        # FIX: "Python hoặc Java" trước đây thành 2 yêu cầu bắt buộc độc
        # lập -> ứng viên chỉ biết Python bị trừ điểm oan vì "thiếu Java".
        profile["requirements"] = self._group_or_requirements(
            profile["requirements"], text
        )

        profile["requirements"] = self._deduplicate_requirements(
            profile["requirements"]
        )
        profile["preferred_qualifications"] = (
            self._deduplicate_requirements(
                profile["preferred_qualifications"]
            )
        )

        return profile

    def _add_structured_requirements(
        self,
        profile: Dict[str, Any],
        requirements: Dict[str, Any],
    ) -> None:
        """Đưa requirements của structured JD về cùng một schema."""
        experience = requirements.get("experience")
        if isinstance(experience, dict):
            minimum = self._number_or_none(experience.get("min_years"))
            maximum = self._number_or_none(experience.get("max_years"))
            description = self._to_text(experience.get("description"))

            if minimum is not None or maximum is not None or description:
                profile["requirements"].append(
                    self._make_experience_requirement(
                        minimum,
                        maximum,
                        description,
                    )
                )

        skills = requirements.get("skills", {})
        if isinstance(skills, dict):
            for skill in self._to_list(skills.get("technical")):
                profile["requirements"].append(
                    self._make_requirement(
                        "skill", skill, source_section="technical"
                    )
                )

            for skill in self._to_list(skills.get("soft")):
                profile["requirements"].append(
                    self._make_requirement(
                        "soft_skill", skill, source_section="soft"
                    )
                )

            for tool in self._to_list(skills.get("tools")):
                profile["requirements"].append(
                    self._make_requirement(
                        "tool", tool, source_section="tools"
                    )
                )

            for language in self._to_list(skills.get("languages")):
                profile["requirements"].append(
                    self._make_requirement(
                        "language", language, source_section="languages"
                    )
                )

        for item in profile["education"]:
            profile["requirements"].append(
                self._make_requirement(
                    "education", item, source_section="education"
                )
            )

        for item in profile["certifications"]:
            profile["requirements"].append(
                self._make_requirement(
                    "certification", item, source_section="certifications"
                )
            )

    def _make_requirement(
        self,
        category: str,
        name: str,
        importance: str = "must_have",
        match_mode: str = "single",
        source_section: str = "",
        alternatives: Optional[List[str]] = None,
        minimum: Optional[int] = None,
        domain: str = "",
        evidence_required: bool = True,
    ) -> Dict[str, Any]:
        item = {
            "id": "",
            "category": category,
            "importance": importance,
            "match_mode": match_mode,
            "name": self._normalize_name(name),
            "alternatives": alternatives or [],
            "source_section": source_section,
            "evidence_required": evidence_required,
        }

        if minimum is not None:
            item["minimum"] = minimum
        if domain:
            item["domain"] = domain

        return item

    def _make_experience_requirement(
        self,
        min_years: Optional[float],
        max_years: Optional[float],
        description: str = "",
    ) -> Dict[str, Any]:
        item = self._make_requirement(
            category="experience",
            name="Professional Experience",
            source_section="experience",
        )
        item["minimum_years"] = min_years
        item["maximum_years"] = max_years
        item["description"] = description
        return item

    def _extract_skills_from_text(self, text: str) -> List[str]:
        if not text:
            return []

        if self.nlp is not None:
            try:
                return self.nlp.normalize_skill_list(
                    self.nlp.extract_skills_from_text(text)
                )
            except Exception:
                pass

        taxonomy = [
            "Python", "Java", "JavaScript", "TypeScript",
            "C++", "C#", "HTML", "CSS", "React", "ReactJS",
            "Next.js", "Vue.js", "Node.js", "Spring Boot",
            "Django", "Flask", "FastAPI", "MySQL", "PostgreSQL",
            "MongoDB", "Redis", "SQL", "Git", "GitHub",
            "Docker", "Kubernetes", "AWS", "Azure", "Google Cloud",
            "Linux", "TensorFlow", "PyTorch", "Scikit-learn",
            "Pandas", "NumPy", "OpenCV", "Jupyter", "MLflow",
            "Airflow", "Spark", "Kafka", "Figma", "Selenium",
            "Postman", "Terraform",
        ]

        lower = text.lower()
        return [
            skill for skill in taxonomy
            if self._contains_term(lower, skill.lower())
        ]

    @classmethod
    def _infer_requirement_category(cls, name: str) -> str:
        value = str(name).strip().lower()

        tools = {
            "git", "github", "gitlab", "vscode", "vs code",
            "docker", "kubernetes", "jupyter", "mlflow",
            "airflow", "postman", "selenium", "figma",
            "terraform", "vmware", "virtualbox", "wireshark",
        }

        languages = {
            "english", "vietnamese", "chinese", "japanese",
            "french", "korean", "german",
        }

        if value in tools:
            return "tool"
        if value in languages:
            return "language"
        if value in {v.lower() for v in cls.SOFT_SKILL_KEYWORDS.values()}:
            return "soft_skill"
        return "skill"

    def _split_sections(self, text: str) -> Dict[str, List[str]]:
        result = {
            "general": [],
            "responsibilities": [],
            "required": [],
            "preferred": [],
            "qualifications": [],
            "experience": [],
        }

        current = "general"

        for raw_line in text.splitlines():
            line = raw_line.strip()
            if not line:
                continue

            heading = self._normalize_heading(line)

            if heading in self.RESPONSIBILITY_HEADINGS:
                current = "responsibilities"
                continue
            if heading in self.PREFERRED_HEADINGS:
                current = "preferred"
                continue
            if heading in self.EXPERIENCE_HEADINGS:
                current = "experience"
                continue
            if heading in self.REQUIRED_HEADINGS:
                current = "required"
                continue
            if heading in self.QUALIFICATION_HEADINGS:
                current = "qualifications"
                continue

            if self._looks_like_heading(line):
                current = "general"
                result["general"].append(line)
                continue

            result[current].append(line)

        return result

    @staticmethod
    def _normalize_heading(line: str) -> str:
        value = str(line).strip().lower()
        value = re.sub(r"^[\-\*\u2022\d\.\)\s]+", "", value)
        value = value.rstrip(":").strip()
        return re.sub(r"\s+", " ", value)

    @staticmethod
    def _looks_like_heading(line: str) -> bool:
        clean = str(line).strip()

        if clean.endswith(":"):
            return True
        if len(clean.split()) > 8:
            return False

        letters = [c for c in clean if c.isalpha()]
        if letters and all(c.isupper() for c in letters):
            return True

        return clean.lower() in {
            "benefits", "salary", "location", "about the company",
            "about us", "what we offer", "working conditions", "perks",
        }

    @staticmethod
    def _extract_title(text: str) -> str:
        for line in text.splitlines():
            clean = re.sub(
                r"^[\-\*\u2022\d\.\)\s]+", "", line.strip()
            )
            if not clean:
                continue

            heading = JDProcessor._normalize_heading(clean)
            if (
                heading in JDProcessor.REQUIRED_HEADINGS
                or heading in JDProcessor.PREFERRED_HEADINGS
                or heading in JDProcessor.RESPONSIBILITY_HEADINGS
            ):
                continue

            if 1 <= len(clean.split()) <= 12:
                return clean

        return ""

    @staticmethod
    def _extract_summary(
        text: str,
        sections: Dict[str, List[str]],
    ) -> str:
        general = sections.get("general", [])
        if general:
            return " ".join(general[:3])

        paragraphs = [
            p.strip()
            for p in re.split(r"\n\s*\n", text)
            if p.strip()
        ]
        return paragraphs[0] if paragraphs else ""

    @staticmethod
    def _parse_experience_from_text(
        text: str,
    ) -> Optional[Dict[str, Any]]:
        if not text:
            return None

        patterns = [
            r"(?:ít nhất|minimum|min\.?)\s*(\d+(?:\.\d+)?)\s*(?:năm|years?)",
            r"(?:từ|tu)\s*(\d+(?:\.\d+)?)\s*(?:năm|years?)",
            r"(\d+(?:\.\d+)?)\s*\+?\s*(?:năm|year|years|yr|yrs)\b",
        ]

        minimum = None
        for pattern in patterns:
            match = re.search(pattern, text, flags=re.IGNORECASE)
            if match:
                minimum = float(match.group(1))
                break

        if minimum is None:
            return None

        return {
            "id": "",
            "category": "experience",
            "importance": "must_have",
            "match_mode": "single",
            "name": "Professional Experience",
            "alternatives": [],
            "minimum_years": minimum,
            "maximum_years": None,
            "source_section": "raw_text",
            "evidence_required": True,
        }

    @staticmethod
    def _extract_education(text: str) -> List[str]:
        patterns = [
            ("đại học", "Đại học"),
            ("cao đẳng", "Cao đẳng"),
            ("cử nhân", "Cử nhân"),
            ("thạc sĩ", "Thạc sĩ"),
            ("cao học", "Cao học"),
            ("bachelor", "Bachelor"),
            ("master", "Master"),
            ("computer science", "Computer Science"),
            ("information technology", "Information Technology"),
        ]

        lower = text.lower()
        return JDProcessor._deduplicate_strings([
            value for needle, value in patterns if needle in lower
        ])

    @staticmethod
    def _extract_certifications(text: str) -> List[str]:
        patterns = [
            r"\bAWS Certified [A-Za-z0-9 \-]+\b",
            r"\bAzure [A-Za-z0-9 \-]*Certification\b",
            r"\bCCNA\b", r"\bCCNP\b", r"\bISTQB\b",
            r"\bCISSP\b", r"\bCEH\b",
            r"\bCompTIA Security\+\b",
        ]

        result = []
        for pattern in patterns:
            result.extend(
                match.strip()
                for match in re.findall(
                    pattern, text, flags=re.IGNORECASE
                )
            )

        return JDProcessor._deduplicate_strings(result)

    def _group_or_requirements(
        self,
        requirements: List[Dict[str, Any]],
        text: str,
    ) -> List[Dict[str, Any]]:
        """
        Gộp các skill/tool nối bằng "hoặc"/"or" trong JD thành MỘT yêu cầu
        dạng "Python hoặc Java" (match_mode = any_of).
        """
        by_name = {
            str(r.get("name", "")).casefold(): r
            for r in requirements
            if isinstance(r, dict)
            and r.get("category") in ("skill", "tool")
            and r.get("name")
        }

        if len(by_name) < 2:
            return requirements

        parent = {name: name for name in by_name}

        def find(name):
            while parent[name] != name:
                parent[name] = parent[parent[name]]
                name = parent[name]
            return name

        def positions(segment):
            found = []
            for name in by_name:
                match = re.search(
                    r"(?<![\w+#.])" + re.escape(name) + r"(?![\w+#])",
                    segment,
                    flags=re.IGNORECASE,
                )
                if match:
                    found.append((match.start(), name))
            return [name for _, name in sorted(found)]

        for line in str(text or "").splitlines():
            segments = re.split(
                r"\s+(?:hoặc|or)\s+", line, flags=re.IGNORECASE
            )
            if len(segments) < 2:
                continue

            for left, right in zip(segments, segments[1:]):
                left_names = positions(left)
                right_names = positions(right)
                if left_names and right_names:
                    a, b = find(left_names[-1]), find(right_names[0])
                    if a != b:
                        parent[b] = a

        groups: Dict[str, List[str]] = {}
        for name in by_name:
            groups.setdefault(find(name), []).append(name)

        merged_names = {
            name for members in groups.values() if len(members) > 1
            for name in members
        }
        if not merged_names:
            return requirements

        result = []
        emitted = set()

        for requirement in requirements:
            key = str(requirement.get("name", "")).casefold()

            if key not in merged_names:
                result.append(requirement)
                continue

            root = find(key)
            if root in emitted:
                continue
            emitted.add(root)

            members = groups[root]
            first = dict(by_name[members[0]])
            first["name"] = " hoặc ".join(
                by_name[m]["name"] for m in members
            )
            first["match_mode"] = "any_of"
            result.append(first)

        return result

    def _deduplicate_requirements(
        self,
        requirements: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        result = []
        seen = set()

        for requirement in requirements:
            if not isinstance(requirement, dict):
                continue

            name = self._normalize_name(requirement.get("name", ""))
            category = str(
                requirement.get("category", "")
            ).strip().lower()
            importance = str(
                requirement.get("importance", "must_have")
            ).strip().lower()

            key = (category, name.casefold(), importance)
            if not name or key in seen:
                continue

            seen.add(key)

            item = dict(requirement)
            item["name"] = name
            result.append(item)

        for index, item in enumerate(result, start=1):
            prefix = (
                "PREF"
                if item.get("importance") == "nice_to_have"
                else "REQ"
            )
            item["id"] = f"{prefix}-{index:03d}"

        return result

    @staticmethod
    def _deduplicate_strings(items: List[str]) -> List[str]:
        result = []
        seen = set()

        for item in items:
            clean = str(item).strip()
            key = clean.casefold()

            if clean and key not in seen:
                seen.add(key)
                result.append(clean)

        return result

    @staticmethod
    def _normalize_name(value: Any) -> str:
        return re.sub(r"\s+", " ", str(value or "").strip())

    @staticmethod
    def _to_text(value: Any) -> str:
        if value is None:
            return ""
        if isinstance(value, list):
            return " ".join(
                str(item).strip()
                for item in value
                if str(item).strip()
            )
        if isinstance(value, dict):
            return " ".join(
                str(item).strip()
                for item in value.values()
                if str(item).strip()
            )
        return str(value).strip()

    @classmethod
    def _to_list(cls, value: Any) -> List[str]:
        if value is None:
            return []
        if isinstance(value, list):
            return [
                str(item).strip()
                for item in value
                if str(item).strip()
            ]
        text = cls._to_text(value)
        return [text] if text else []

    @staticmethod
    def _number_or_none(value: Any) -> Optional[float]:
        if value is None or value == "":
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    @classmethod
    def _extract_keyword_matches(
        cls,
        text: str,
        keyword_map: Dict[str, str],
    ) -> List[str]:
        """Tìm các từ khóa (soft skill/ngôn ngữ) xuất hiện trong text."""
        if not text:
            return []

        lower = text.lower()
        result = []
        seen = set()

        for keyword, display in keyword_map.items():
            if display in seen:
                continue
            if cls._contains_term(lower, keyword):
                seen.add(display)
                result.append(display)

        return result

    @staticmethod
    def _contains_term(text: str, term: str) -> bool:
        # Luôn dùng ranh giới từ để tránh khớp nhầm chuỗi con,
        # kể cả với từ ngắn (VD: "SQL" nằm trong "PostgreSQL",
        # "Go" nằm trong "Django"/"Google").
        pattern = (
            r"(?<![a-zA-Z0-9+#.-])"
            + re.escape(term)
            + r"(?![a-zA-Z0-9+#.-])"
        )
        return re.search(pattern, text, flags=re.IGNORECASE) is not None

    @staticmethod
    def _empty_profile() -> Dict[str, Any]:
        return {
            "type": "job_description",
            "id": "",
            "title": "",
            "company": "",
            "level": "",
            "employment_type": "",
            "summary": "",
            "responsibilities": [],
            "requirements": [],
            "preferred_qualifications": [],
            "education": [],
            "certifications": [],
            "domains": [],
            "work_conditions": {},
            "benefits": [],
            "recruitment_process": [],
            "metadata": {"source": "unknown"},
        }

