"""
jd_profile.py

Chuẩn hóa kết quả từ jd_processor.py thành Generic JD Profile.

Luồng:
    JD user nhập
        -> jd_processor.py
        -> jd_profile.py
        -> Generic JD Profile
        -> career_intelligence.py

Module này KHÔNG:
    - đọc CV
    - xây career framework
    - chấm điểm ứng viên
    - so khớp CV-JD
    - đọc dataset career framework

Lưu ý:
    jd_processor.py đã thực hiện phần lớn việc bóc tách JD.
    File này chỉ chuẩn hóa và kiểm tra schema cuối cùng để các module
    phía sau có một đầu vào ổn định.
"""

from typing import Any, Dict, List


REQUIRED_FIELDS = (
    "type",
    "id",
    "title",
    "company",
    "level",
    "employment_type",
    "summary",
    "responsibilities",
    "requirements",
    "preferred_qualifications",
    "education",
    "certifications",
    "domains",
    "work_conditions",
    "benefits",
    "recruitment_process",
    "metadata",
)


def build_jd_profile(processed_jd: Dict[str, Any]) -> Dict[str, Any]:
    """
    Chuẩn hóa output của JDProcessor thành Generic JD Profile.

    Args:
        processed_jd:
            Kết quả từ:
                JDProcessor().process_jd(...)

    Returns:
        Generic JD Profile.
    """
    if not isinstance(processed_jd, dict):
        raise TypeError("processed_jd phải là dict.")

    if processed_jd.get("type") != "job_description":
        raise ValueError(
            "processed_jd không phải Job Description Profile."
        )

    profile = _empty_profile()

    for field in REQUIRED_FIELDS:
        if field in processed_jd:
            profile[field] = processed_jd[field]

    profile["type"] = "job_description"
    profile["id"] = _to_text(profile["id"])
    profile["title"] = _to_text(profile["title"])
    profile["company"] = _to_text(profile["company"])
    profile["level"] = _to_text(profile["level"])
    profile["employment_type"] = _to_text(
        profile["employment_type"]
    )
    profile["summary"] = _to_text(profile["summary"])

    profile["responsibilities"] = _to_list(
        profile["responsibilities"]
    )
    profile["requirements"] = _normalize_requirements(
        profile["requirements"]
    )
    profile["preferred_qualifications"] = _normalize_requirements(
        profile["preferred_qualifications"],
        default_importance="nice_to_have",
    )
    profile["education"] = _to_list(profile["education"])
    profile["certifications"] = _to_list(
        profile["certifications"]
    )
    profile["domains"] = _to_list(profile["domains"])
    profile["benefits"] = _to_list(profile["benefits"])
    profile["recruitment_process"] = _to_list(
        profile["recruitment_process"]
    )

    if not isinstance(profile["work_conditions"], dict):
        profile["work_conditions"] = {}

    if not isinstance(profile["metadata"], dict):
        profile["metadata"] = {}

    profile["metadata"] = {
        **profile["metadata"],
        "profile_type": "generic_jd_profile",
    }

    return profile


class JDProfile:
    """
    Wrapper đơn giản cho Generic JD Profile.

    Dùng khi muốn giữ JD Profile dưới dạng object,
    nhưng không chứa logic nghiệp vụ.
    """

    def __init__(self, processed_jd: Dict[str, Any]):
        self.data = build_jd_profile(processed_jd)

    def to_dict(self) -> Dict[str, Any]:
        return dict(self.data)


def _normalize_requirements(
    requirements: Any,
    default_importance: str = "must_have",
) -> List[Dict[str, Any]]:
    if not isinstance(requirements, list):
        return []

    result = []

    for index, item in enumerate(requirements, start=1):
        if not isinstance(item, dict):
            continue

        name = _to_text(item.get("name"))
        if not name:
            continue

        normalized = dict(item)

        normalized["id"] = _to_text(
            normalized.get("id")
        ) or f"REQ-{index:03d}"

        normalized["category"] = _to_text(
            normalized.get("category")
        ) or "skill"

        normalized["importance"] = _to_text(
            normalized.get("importance")
        ) or default_importance

        normalized["match_mode"] = _to_text(
            normalized.get("match_mode")
        ) or "single"

        normalized["name"] = name

        alternatives = normalized.get("alternatives", [])
        normalized["alternatives"] = _to_list(alternatives)

        normalized["source_section"] = _to_text(
            normalized.get("source_section")
        )

        if "evidence_required" not in normalized:
            normalized["evidence_required"] = True

        result.append(normalized)

    return result


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
        "metadata": {},
    }


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


def _to_list(value: Any) -> List[str]:
    if value is None:
        return []

    if isinstance(value, list):
        return [
            str(item).strip()
            for item in value
            if str(item).strip()
        ]

    text = _to_text(value)
    return [text] if text else []
