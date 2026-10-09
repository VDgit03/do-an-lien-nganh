# candidate_profile.py

from typing import Any, Dict, List, Optional
import ast
import datetime
import re


class CandidateProfile:
    """
    Xây dựng Candidate Profile từ dữ liệu CV đã được xử lý.

    Input:
        structured_cv:
            CV đã được structure_cv.py chuyển thành dictionary.

        processed_cv:
            Kết quả từ nlp_processor.py.process_cv().

    Output:
        Candidate Profile chuẩn hóa, phục vụ cho:
            - career_framework.py
            - career_intelligence.py
            - cv_evaluator.py
            - recommendation_engine.py
    """

    def __init__(
        self,
        structured_cv: Optional[Dict[str, Any]] = None,
        processed_cv: Optional[Dict[str, Any]] = None,
    ):
        self.structured_cv = structured_cv or {}
        self.processed_cv = processed_cv or {}

    # ============================================================
    # PUBLIC API
    # ============================================================

    def build(self) -> Dict[str, Any]:
        """
        Xây dựng Candidate Profile hoàn chỉnh.
        """

        profile = {
            "personal": self._build_personal(),

            "career": self._build_career(),

            "summary": self._build_summary(),

            "skills": self._build_skills(),

            "experience": self._build_experience(),

            "projects": self._build_projects(),

            "education": self._build_education(),

            "certifications": self._build_certifications(),

            "languages": self._build_languages(),

            "achievements": self._build_achievements(),

            "evidence": self._build_evidence(),

            "skill_groups": self._build_skill_groups(),

            "other_sections": self._build_other_sections(),
        }

        return profile

    # ============================================================
    # PERSONAL
    # ============================================================

    def _build_personal(self) -> Dict[str, Any]:
        personal = self.structured_cv.get("personal", {})

        if not isinstance(personal, dict):
            personal = {}

        return {
            "name": self._clean_value(personal.get("name")),
            "email": self._clean_value(personal.get("email")),
            "phone": self._clean_value(personal.get("phone")),
            "location": self._clean_value(personal.get("location")),
            "linkedin": self._clean_value(personal.get("linkedin")),
            "github": self._clean_value(personal.get("github")),
            "portfolio": self._clean_value(personal.get("portfolio")),
        }

    # ============================================================
    # CAREER
    # ============================================================

    def _build_career(self) -> Dict[str, Any]:
        """
        Xây dựng career information.

        Phân biệt:
            - Work experience
            - Project experience
            - Target role
            - Career stage

        Project không được tính thành work experience.
        """

        experience = self._get_experience()
        projects = self._get_projects()

        total_years = self._calculate_experience_years(experience)

        roles = []

        # Lấy role từ work experience
        for item in experience:
            role = (
                item.get("position")
                or item.get("title")
                or item.get("role")
                or item.get("job_title")
            )

            role = self._clean_value(role)

            if role and role not in roles:
                roles.append(role)

        # Nếu không có work experience,
        # có thể lấy role từ project nhưng KHÔNG tính thành work experience.
        if not roles:
            for project in projects:
                role = (
                    project.get("role")
                    or project.get("position")
                    or project.get("title")
                )

                role = self._clean_value(role)

                if role and role not in roles:
                    roles.append(role)

        current_role = roles[0] if roles else None

        target_role = self._extract_target_role()

        career_stage = self._infer_career_stage(
            total_years=total_years,
            experience=experience,
            projects=projects,
        )

        return {
            "current_role": current_role,
            "target_role": target_role,
            "roles": roles,
            "total_experience_years": total_years,
            "project_count": len(projects),
            "career_stage": career_stage,
        }

    def _extract_target_role(self) -> Optional[str]:
        """
        Tìm target role từ career/summary.

        Ví dụ:

        "Long term goal is to become a Frontend & Mobile
        Software Engineer..."

        -> Frontend & Mobile Software Engineer
        """

        summary = self.processed_cv.get("summary")

        if summary is None:
            summary = self.structured_cv.get("summary")

        summary_text = self._extract_text(summary)

        if not summary_text:
            return None

        patterns = [
            r"(?:goal|aim|aspire|want|plan|objective)"
            r".{0,100}?"
            r"(?:to become|become|as)"
            r"\s+(?:a|an)?\s*"
            r"([A-Z][A-Za-z0-9&/,\- ]{2,80})",

            r"(?:become|becoming)\s+(?:a|an)?\s*"
            r"([A-Z][A-Za-z0-9&/,\- ]{2,80})",
        ]

        for pattern in patterns:
            match = re.search(
                pattern,
                summary_text,
                flags=re.IGNORECASE,
            )

            if match:
                role = match.group(1).strip()

                # Loại bỏ phần dư thường gặp sau target role.
                role = re.split(
                    r",|\.|;|\band\b capable",
                    role,
                    maxsplit=1,
                    flags=re.IGNORECASE,
                )[0].strip()

                if role:
                    return role

        return None

    def _infer_career_stage(
        self,
        total_years: Optional[float],
        experience: List[Dict[str, Any]],
        projects: List[Dict[str, Any]],
    ) -> Optional[str]:
        """
        Xác định career stage.

        Quy tắc hiện tại:

            Có education đang học + không có work experience
                -> student

            Không có work experience + có project
                -> entry

            < 1 năm
                -> entry

            1-3 năm
                -> junior

            3-5 năm
                -> mid

            5-8 năm
                -> senior

            >= 8 năm
                -> senior_plus
        """

        # Có work experience
        if experience:

            if total_years is None:
                return "entry"

            if total_years < 1:
                return "entry"

            if total_years < 3:
                return "junior"

            if total_years < 5:
                return "mid"

            if total_years < 8:
                return "senior"

            return "senior_plus"

        # Không có work experience nhưng vẫn đang học
        if self._has_ongoing_education():
            return "student"

        # Không có work experience nhưng có project
        if projects:
            return "entry"

        return None

    def _has_ongoing_education(self) -> bool:
        """
        Kiểm tra education có trạng thái đang học hay không.

        Hỗ trợ các format như:
            "2023 - Now"
            "2023 - Present"
            "2023 - hiện tại"
        """

        education = self.structured_cv.get(
            "education",
            []
        )

        if not isinstance(education, list):
            return False

        ongoing_keywords = [
            "now",
            "present",
            "current",
            "ongoing",
            "currently",
            "hiện tại",
            "nay",
        ]

        for item in education:

            if not isinstance(item, dict):
                continue

            values = [
                item.get("date"),
                item.get("end_date"),
                item.get("to"),
            ]

            for value in values:

                if not value:
                    continue

                text = str(value).lower().strip()

                if any(
                    keyword in text
                    for keyword in ongoing_keywords
                ):
                    return True

        return False

    # ============================================================
    # SUMMARY
    # ============================================================

    def _build_summary(self) -> Dict[str, Any]:
        summary = self.processed_cv.get("summary")

        if summary is None:
            summary = self.structured_cv.get("summary")

        if isinstance(summary, dict):
            return summary

        return {
            "text": self._clean_value(summary),
        }

    # ============================================================
    # SKILLS
    # ============================================================

    def _build_skills(self) -> Dict[str, Any]:
        """
        Lấy skills đã được chuẩn hóa từ nlp_processor.py.
        """

        skills = self.processed_cv.get("skills")

        if skills is None:
            skills = self.structured_cv.get("skills", [])

        if isinstance(skills, dict):
            return skills

        normalized_skills = []

        if isinstance(skills, list):

            for skill in skills:

                if isinstance(skill, str):

                    skill_name = self._clean_value(skill)

                    if skill_name:
                        normalized_skills.append(skill_name)

                elif isinstance(skill, dict):

                    normalized_skills.append(skill)

        return {
            "items": normalized_skills,
            "count": len(normalized_skills),
        }

    # ============================================================
    # EXPERIENCE
    # ============================================================

    def _build_experience(self) -> List[Dict[str, Any]]:
        """
        Chuẩn hóa work experience.
        """

        experience = self.processed_cv.get("experience")

        if experience is None:
            experience = self.structured_cv.get(
                "experience",
                []
            )

        if not isinstance(experience, list):
            return []

        result = []

        for item in experience:

            if not isinstance(item, dict):
                continue

            normalized = dict(item)

            normalized["company"] = self._clean_value(
                item.get("company")
            )

            normalized["position"] = self._clean_value(
                item.get("position")
                or item.get("title")
                or item.get("role")
                or item.get("job_title")
            )

            # FIX 1:
            # description luôn trở thành List[str]
            normalized["description"] = (
                self._normalize_description(
                    item.get("description")
                )
            )

            normalized["start_date"] = self._clean_value(
                item.get("start_date")
                or item.get("from")
                or item.get("start")
            )

            normalized["end_date"] = self._clean_value(
                item.get("end_date")
                or item.get("to")
                or item.get("end")
            )

            normalized["skills"] = self._extract_item_skills(item)

            normalized["achievements"] = (
                self._extract_achievements(item)
            )

            normalized["evidence"] = (
                self._build_experience_evidence(
                    normalized
                )
            )

            result.append(normalized)

        return result

    # ============================================================
    # PROJECTS
    # ============================================================

    def _build_projects(self) -> List[Dict[str, Any]]:
        """
        Chuẩn hóa projects.
        """

        projects = self.processed_cv.get("projects")

        if projects is None:
            projects = self.structured_cv.get(
                "projects",
                []
            )

        if not isinstance(projects, list):
            return []

        result = []

        for item in projects:

            if not isinstance(item, dict):
                continue

            normalized = dict(item)

            normalized["name"] = self._clean_value(
                item.get("name")
                or item.get("title")
                or item.get("project_name")
            )

            # FIX 1:
            # description luôn trở thành List[str]
            normalized["description"] = (
                self._normalize_description(
                    item.get("description")
                )
            )

            normalized["technologies"] = (
                self._extract_item_skills(item)
            )

            normalized["achievements"] = (
                self._extract_achievements(item)
            )

            normalized["evidence"] = (
                self._build_project_evidence(
                    normalized
                )
            )

            result.append(normalized)

        return result

    # ============================================================
    # EDUCATION
    # ============================================================

    def _build_education(self) -> List[Dict[str, Any]]:
        education = self.structured_cv.get(
            "education",
            []
        )

        if not isinstance(education, list):
            return []

        result = []

        for item in education:

            if not isinstance(item, dict):
                continue

            normalized = dict(item)

            normalized["institution"] = self._clean_value(
                item.get("institution")
                or item.get("school")
                or item.get("university")
            )

            normalized["degree"] = self._clean_value(
                item.get("degree")
            )

            normalized["field"] = self._clean_value(
                item.get("field")
                or item.get("major")
                or item.get("specialization")
            )

            normalized["start_date"] = self._clean_value(
                item.get("start_date")
                or item.get("from")
            )

            normalized["end_date"] = self._clean_value(
                item.get("end_date")
                or item.get("to")
            )

            result.append(normalized)

        return result

    # ============================================================
    # CERTIFICATIONS
    # ============================================================

    def _build_certifications(self) -> List[Dict[str, Any]]:
        certifications = self.processed_cv.get(
            "certifications"
        )

        if certifications is None:
            certifications = self.structured_cv.get(
                "certifications",
                []
            )

        if not isinstance(certifications, list):
            return []

        return [
            item
            for item in certifications
            if isinstance(item, dict)
        ]

    # ============================================================
    # LANGUAGES
    # ============================================================

    def _build_languages(self) -> List[Any]:

        languages = self.structured_cv.get(
            "languages",
            []
        )

        if isinstance(languages, list):
            return languages

        return []

    # ============================================================
    # ACHIEVEMENTS
    # ============================================================

    def _build_achievements(self) -> List[Dict[str, Any]]:
        """
        Tổng hợp achievements từ:
            - experience
            - projects
            - awards
        """

        achievements = []

        # Experience
        for exp in self._build_experience():

            for achievement in exp.get(
                "achievements",
                []
            ):

                achievements.append({
                    "source": "experience",
                    "text": achievement,
                    "company": exp.get("company"),
                    "position": exp.get("position"),
                })

        # Projects
        for project in self._build_projects():

            for achievement in project.get(
                "achievements",
                []
            ):

                achievements.append({
                    "source": "project",
                    "text": achievement,
                    "project": project.get("name"),
                })

        # Awards
        awards = self.structured_cv.get(
            "awards",
            []
        )

        if isinstance(awards, list):

            for award in awards:

                if isinstance(award, dict):

                    achievements.append({
                        "source": "award",
                        **award,
                    })

                elif isinstance(award, str):

                    achievements.append({
                        "source": "award",
                        "text": award,
                    })

        return achievements

    # ============================================================
    # EVIDENCE
    # ============================================================

    def _build_evidence(self) -> Dict[str, Any]:
        """
        Tổng hợp evidence chứng minh skill.

        Không tự tạo evidence cho skill nếu CV không
        có thông tin chứng minh.
        """

        skill_evidence = {}

        skills = self._build_skills()

        skill_items = (
            skills.get("items", [])
            if isinstance(skills, dict)
            else []
        )

        for skill in skill_items:

            if isinstance(skill, str):

                skill_name = skill

            elif isinstance(skill, dict):

                skill_name = (
                    skill.get("name")
                    or skill.get("skill")
                    or skill.get("normalized")
                )

            else:
                continue

            if not skill_name:
                continue

            skill_evidence[skill_name] = []

            # ----------------------------------------------------
            # Experience evidence
            # ----------------------------------------------------

            for exp in self._build_experience():

                exp_skills = exp.get(
                    "skills",
                    []
                )

                if self._contains_skill(
                    exp_skills,
                    skill_name
                ):

                    skill_evidence[
                        skill_name
                    ].append({
                        "source": "experience",
                        "company": exp.get(
                            "company"
                        ),
                        "position": exp.get(
                            "position"
                        ),
                        "evidence": exp.get(
                            "description",
                            [],
                        ),
                    })

            # ----------------------------------------------------
            # Project evidence
            # ----------------------------------------------------

            for project in self._build_projects():

                project_skills = project.get(
                    "technologies",
                    []
                )

                if self._contains_skill(
                    project_skills,
                    skill_name
                ):

                    skill_evidence[
                        skill_name
                    ].append({
                        "source": "project",
                        "project": project.get(
                            "name"
                        ),
                        "evidence": project.get(
                            "description",
                            [],
                        ),
                    })

        return {
            "skill_evidence": skill_evidence,

            "total_evidence": sum(
                len(items)
                for items in skill_evidence.values()
            ),
        }

    # ============================================================
    # EXPERIENCE EVIDENCE
    # ============================================================

    def _build_experience_evidence(
        self,
        experience: Dict[str, Any]
    ) -> List[Dict[str, Any]]:

        evidence = []

        descriptions = experience.get(
            "description",
            []
        )

        if isinstance(descriptions, list):

            for description in descriptions:

                if description:
                    evidence.append({
                        "type": "description",
                        "text": description,
                    })

        for achievement in experience.get(
            "achievements",
            []
        ):

            evidence.append({
                "type": "achievement",
                "text": achievement,
            })

        return evidence

    # ============================================================
    # PROJECT EVIDENCE
    # ============================================================

    def _build_project_evidence(
        self,
        project: Dict[str, Any]
    ) -> List[Dict[str, Any]]:

        evidence = []

        descriptions = project.get(
            "description",
            []
        )

        if isinstance(descriptions, list):

            for description in descriptions:

                if description:
                    evidence.append({
                        "type": "description",
                        "text": description,
                    })

        for achievement in project.get(
            "achievements",
            []
        ):

            evidence.append({
                "type": "achievement",
                "text": achievement,
            })

        return evidence

    # ============================================================
    # HELPERS
    # ============================================================

    def _build_skill_groups(self) -> Dict[str, List[str]]:
        """Nhóm kỹ năng đúng như CV khai báo (Backend/Frontend/...)."""
        groups = self.structured_cv.get("skill_groups")

        if not isinstance(groups, dict):
            return {}

        return {
            str(name): [str(v) for v in values]
            for name, values in groups.items()
            if isinstance(values, list) and values
        }

    def _build_other_sections(self) -> List[Dict[str, str]]:
        """Các mục ngoài (Activities, More information, Interest...)."""
        other = self.structured_cv.get("other")

        if not isinstance(other, list):
            return []

        return [
            {
                "section": str(item.get("section") or ""),
                "content": str(item.get("content") or ""),
            }
            for item in other
            if isinstance(item, dict)
        ]

    def _get_experience(self) -> List[Dict[str, Any]]:
        experience = self.processed_cv.get(
            "experience"
        )

        if experience is None:
            experience = self.structured_cv.get(
                "experience",
                []
            )

        if not isinstance(experience, list):
            return []

        return [
            item
            for item in experience
            if isinstance(item, dict)
        ]

    def _get_projects(self) -> List[Dict[str, Any]]:
        projects = self.processed_cv.get(
            "projects"
        )

        if projects is None:
            projects = self.structured_cv.get(
                "projects",
                []
            )

        if not isinstance(projects, list):
            return []

        return [
            item
            for item in projects
            if isinstance(item, dict)
        ]

    def _extract_item_skills(
        self,
        item: Dict[str, Any]
    ) -> List[Any]:

        possible_keys = [
            "skills",
            "technologies",
            "technology",
            "tools",
            "tech_stack",
            "technical_skills",
        ]

        for key in possible_keys:

            value = item.get(key)

            if isinstance(value, list):
                return value

            if isinstance(value, str):

                return [
                    skill.strip()
                    for skill in value.split(",")
                    if skill.strip()
                ]

        return []

    def _extract_achievements(
        self,
        item: Dict[str, Any]
    ) -> List[str]:

        possible_keys = [
            "achievements",
            "achievement",
            "accomplishments",
            "highlights",
            "results",
        ]

        achievements = []

        for key in possible_keys:

            value = item.get(key)

            if isinstance(value, list):

                achievements.extend(
                    str(x).strip()
                    for x in value
                    if str(x).strip()
                )

            elif isinstance(value, str):

                achievements.append(
                    value.strip()
                )

        # Nếu description đã là list,
        # không tự coi toàn bộ description là achievement.
        #
        # Chỉ lấy bullet nếu description chứa bullet.
        descriptions = self._normalize_description(
            item.get("description")
        )

        for line in descriptions:

            line = line.strip()

            if line.startswith(
                ("-", "•", "*")
            ):

                clean_line = line.lstrip(
                    "-•* "
                ).strip()

                if clean_line:
                    achievements.append(
                        clean_line
                    )

        return self._unique(achievements)

    def _normalize_description(
        self,
        value: Any
    ) -> List[str]:
        """
        Chuẩn hóa description về List[str].

        Xử lý cả trường hợp NLP trả:

            "['text 1', 'text 2']"

        và:

            ['text 1', 'text 2']

        và:

            'single text'
        """

        if value is None:
            return []

        # Đã là list
        if isinstance(value, list):

            result = []

            for item in value:

                if item is None:
                    continue

                text = str(item).strip()

                if text:
                    result.append(text)

            return self._unique(result)

        # String
        if isinstance(value, str):

            text = value.strip()

            if not text:
                return []

            # String có format:
            # "['text 1', 'text 2']"
            if (
                text.startswith("[")
                and text.endswith("]")
            ):

                try:

                    parsed = ast.literal_eval(
                        text
                    )

                    if isinstance(
                        parsed,
                        list
                    ):

                        result = []

                        for item in parsed:

                            if item is None:
                                continue

                            item_text = str(
                                item
                            ).strip()

                            if item_text:
                                result.append(
                                    item_text
                                )

                        return self._unique(
                            result
                        )

                except (
                    ValueError,
                    SyntaxError
                ):
                    pass

            # String thông thường
            return [text]

        return [str(value).strip()]

    def _extract_text(
        self,
        value: Any
    ) -> str:
        """
        Chuyển summary/object về text để xử lý.
        """

        if value is None:
            return ""

        if isinstance(value, str):
            return value.strip()

        if isinstance(value, dict):

            text = value.get("text")

            if text is not None:
                return str(text).strip()

            # fallback
            return " ".join(
                str(v)
                for v in value.values()
                if v
            ).strip()

        if isinstance(value, list):

            return " ".join(
                str(item)
                for item in value
                if item
            ).strip()

        return str(value).strip()

    _MONTHS = {
        "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
        "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
    }

    _PRESENT_RE = r"present|now|current(?:ly)?|ongoing|today|nay|hiện tại"

    _DATE_TOKEN_RE = re.compile(
        r"(?:\d{1,2}\s*[/.\-]\s*)?(?:19|20)\d{2}"
        r"|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?"
        r"\s*(?:19|20)\d{2}"
        r"|present|now|current(?:ly)?|ongoing|today|nay|hiện tại",
        re.IGNORECASE,
    )

    def _calculate_experience_years(
        self,
        experience: List[Dict[str, Any]]
    ) -> Optional[float]:
        """
        Tổng số năm kinh nghiệm làm việc.

        FIX so với bản cũ:
            - Năm kết thúc "Present/Now" không còn hardcode 2026 mà lấy
              theo ngày hiện tại.
            - Tính theo THÁNG (06/2024 - 09/2024 = 4 tháng) thay vì chỉ
              trừ năm (trước đây = 0 năm).
            - Các khoảng thời gian chồng lấn (làm 2 nơi cùng lúc) được gộp
              lại, không cộng dồn.
            - Entry chỉ có một mốc thời gian (không rõ kết thúc) bị bỏ qua
              thay vì mặc định "đến nay".
        """

        if not experience:
            return 0.0

        today = datetime.date.today()
        today_index = today.year * 12 + (today.month - 1)

        intervals = []

        for item in experience:
            interval = self._experience_interval(item, today_index)
            if interval:
                intervals.append(interval)

        if not intervals:
            return 0.0

        intervals.sort()
        merged = [list(intervals[0])]

        for start, end in intervals[1:]:
            if start <= merged[-1][1]:
                merged[-1][1] = max(merged[-1][1], end)
            else:
                merged.append([start, end])

        months = sum(end - start for start, end in merged)

        return round(months / 12, 1)

    def _experience_interval(self, item, today_index):
        """Trả (start_index, end_index_exclusive) tính theo tháng."""

        start_raw = (
            item.get("start_date")
            or item.get("from")
            or item.get("start")
        )
        end_raw = (
            item.get("end_date")
            or item.get("to")
            or item.get("end")
        )

        if start_raw:
            text = f"{start_raw} {end_raw or ''}"
        else:
            text = str(
                item.get("date")
                or item.get("duration")
                or item.get("period")
                or ""
            )

        tokens = self._DATE_TOKEN_RE.findall(text)

        if len(tokens) < 2:
            return None

        start = self._month_index(tokens[0], False, today_index)
        end = self._month_index(tokens[1], True, today_index)

        if start is None or end is None or end < start:
            return None

        return start, end + 1

    def _month_index(self, token, is_end, today_index):
        token = token.strip().lower()

        if re.fullmatch(self._PRESENT_RE, token):
            return today_index

        month, year = None, None

        numeric = re.fullmatch(
            r"(\d{1,2})\s*[/.\-]\s*((?:19|20)\d{2})", token
        )
        named = re.fullmatch(
            r"([a-z]+)\.?\s*((?:19|20)\d{2})", token
        )
        year_only = re.fullmatch(r"((?:19|20)\d{2})", token)

        if numeric:
            month, year = int(numeric.group(1)), int(numeric.group(2))
        elif named:
            month = self._MONTHS.get(named.group(1)[:3])
            year = int(named.group(2))
        elif year_only:
            year = int(year_only.group(1))
            month = 12 if is_end else 1

        if year is None or month is None or not 1 <= month <= 12:
            return None

        return min(year * 12 + (month - 1), today_index)

    def _extract_experience_period(
        self,
        item: Dict[str, Any]
    ):
        """
        Lấy mốc start/end của một experience entry.

        BUG CŨ: hàm chỉ tìm các key rời "start_date"/"end_date"/"from"/"to"/
        "start"/"end". Nhưng structure_cv.py + nlp_processor.py lại trả về
        một field "date" duy nhất dạng chuỗi khoảng thời gian, ví dụ:
            "Jan 2020 - Dec 2022" hoặc "01/2023 - Present"
        Vì các key rời kia không tồn tại -> start/end luôn None ->
        total_experience_years luôn = 0.0 dù CV có ghi rõ mốc thời gian.

        Fix: nếu có "date" (hoặc "duration"/"period") dạng khoảng thời
        gian, tách thành start/end bằng dấu gạch ngang; vẫn giữ tương
        thích ngược với các key rời cũ nếu có.
        """

        start = (
            item.get("start_date")
            or item.get("from")
            or item.get("start")
        )

        end = (
            item.get("end_date")
            or item.get("to")
            or item.get("end")
        )

        if start and end:
            return start, end

        date_range = (
            item.get("date")
            or item.get("duration")
            or item.get("period")
        )

        if date_range and not isinstance(date_range, (dict, list)):
            date_range = str(date_range)

            parts = re.split(
                r"\s*[-–—]\s*",
                date_range,
                maxsplit=1,
            )

            if len(parts) == 2:
                start = start or parts[0]
                end = end or parts[1]
            elif not start:
                # Chỉ có một mốc thời gian duy nhất (không phải khoảng).
                start = start or date_range

        return start, end

    def _extract_year(
        self,
        value: Any
    ) -> Optional[int]:

        if value is None:
            return None

        match = re.search(
            r"(19|20)\d{2}",
            str(value)
        )

        if not match:
            return None

        return int(
            match.group(0)
        )

    def _contains_skill(
        self,
        skills: List[Any],
        target: str
    ) -> bool:

        target = target.lower().strip()

        for skill in skills:

            if isinstance(skill, str):

                value = skill

            elif isinstance(skill, dict):

                value = (
                    skill.get("name")
                    or skill.get("skill")
                    or skill.get("normalized")
                    or ""
                )

            else:
                continue

            if (
                str(value)
                .lower()
                .strip()
                == target
            ):
                return True

        return False

    @staticmethod
    def _clean_value(
        value: Any
    ) -> Optional[str]:

        if value is None:
            return None

        if isinstance(value, str):

            value = value.strip()

            return (
                value
                if value
                else None
            )

        return str(value).strip()

    @staticmethod
    def _unique(
        items: List[Any]
    ) -> List[Any]:

        result = []
        seen = set()

        for item in items:

            key = str(
                item
            ).strip().lower()

            if key not in seen:

                seen.add(key)
                result.append(item)

        return result


# ================================================================
# CONVENIENCE FUNCTION
# ================================================================

def build_candidate_profile(
    structured_cv: Optional[Dict[str, Any]] = None,
    processed_cv: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Convenience function để sử dụng nhanh.
    """

    builder = CandidateProfile(
        structured_cv=structured_cv,
        processed_cv=processed_cv,
    )

    return builder.build()