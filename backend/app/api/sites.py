from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.trial import Site
from app.schemas.trial import TrialSiteSchema
from app.api.trials import map_site_to_schema

router = APIRouter(prefix="/api/v1/sites", tags=["Sites"])


@router.get("", response_model=List[TrialSiteSchema])
def list_all_sites(db: Session = Depends(get_db)):
    """List all clinical study sites across trials."""
    sites = db.query(Site).all()
    return [map_site_to_schema(s) for s in sites]


@router.get("/{identifier}", response_model=TrialSiteSchema)
def get_site_by_id(identifier: str, db: Session = Depends(get_db)):
    """Get site details by siteId, siteCode, or id."""
    site = db.query(Site).filter(
        or_(
            Site.site_id == identifier,
            Site.site_code == identifier,
            Site.id == identifier,
        )
    ).first()

    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trial Site '{identifier}' not found",
        )
    return map_site_to_schema(site)
