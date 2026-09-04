from typing import List
from fastapi import APIRouter
from pydantic import BaseModel
from app.rules.registry import ALL_RULES

router = APIRouter(prefix="/api/v1/rules", tags=["Governance Rules Catalog"])


class RuleCatalogItem(BaseModel):
    code: str
    title: str
    domain: str
    defaultLevel: str
    description: str


@router.get("", response_model=List[RuleCatalogItem])
def list_governance_rules():
    """List all 10 registered clinical governance rules across the 6 domains."""
    return [
        RuleCatalogItem(
            code=r.code,
            title=r.title,
            domain=r.domain.value,
            defaultLevel=r.default_level.value,
            description=r.description,
        )
        for r in ALL_RULES
    ]
