from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.trials import router as trials_router
from app.api.sites import router as sites_router
from app.api.participants import router as participants_router
from app.api.changesets import router as changesets_router
from app.api.compiler import router as compiler_router
from app.api.evidence import router as evidence_router
from app.api.audit import router as audit_router
from app.api.rules import router as rules_router
from app.api.advisory import router as advisory_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(trials_router)
api_router.include_router(sites_router)
api_router.include_router(participants_router)
api_router.include_router(changesets_router)
api_router.include_router(compiler_router)
api_router.include_router(evidence_router)
api_router.include_router(audit_router)
api_router.include_router(rules_router)
api_router.include_router(advisory_router)
