import logging
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import engine, Base
from app.api import api_router
from app.schemas.common import ApiErrorResponse, ErrorDetails
import app.guardrails.ai_guardrails  # Register default-deny security event listener

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ayu_trial_fabric")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler: ensures tables and demo seed data exist upon startup."""
    try:
        Base.metadata.create_all(bind=engine)
        from app.seed import seed_database
        seed_database()
        logger.info("Database tables and seed records verified on startup.")
    except Exception as e:
        logger.warning(f"Startup database initialization notice: {e}")
    yield


app = FastAPI(
    title="Ayu-Trial Fabric - Core Intelligence & Governance API",
    description="Backend and Implementation Compiler API for Ayurveda Clinical Trial Management",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(api_router)


@app.get("/health", tags=["Health & Diagnostics"])
def health_check():
    """Health check endpoint for Render/Railway probes and load balancers."""
    return {
        "status": "healthy",
        "service": "Ayu-Trial Fabric Core Governance API",
        "environment": settings.ENVIRONMENT,
        "database": "connected"
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler returning standardized ApiErrorResponse."""
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    error_response = ApiErrorResponse(
        success=False,
        error=ErrorDetails(
            code="INTERNAL_SERVER_ERROR",
            message=str(exc) if settings.ENVIRONMENT == "development" else "An unexpected error occurred",
            details=[f"Path: {request.url.path}"],
        )
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_response.model_dump(),
    )
