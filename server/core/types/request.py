# types/request.py
from typing import TypedDict, Any

class ChartRequest(TypedDict):
    start_date: str
    end_date: str
    census_block: str | None
    filters: dict[str, Any]

class DemographicRequest(ChartRequest):
    demographic_features: list[str]
