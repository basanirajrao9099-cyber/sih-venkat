"""
Ayu-Trial Fabric: Safe Advisory AI Layer Guardrails.
Enforces multi-tiered, code-level structural boundaries ensuring AI components
cannot mutate clinical trial governance state (Finding, Obligation, Readiness, etc.).
"""

import logging
from contextvars import ContextVar
from contextlib import contextmanager
from typing import Generator
from sqlalchemy import event, text
from sqlalchemy.orm import Session
from app.database import SessionLocal

logger = logging.getLogger("ayu_trial_fabric.guardrails")

# Thread-safe and async-safe context variable tracking advisory AI execution
_is_advisory_active: ContextVar[bool] = ContextVar("is_advisory_active", default=False)


def is_advisory_active() -> bool:
    """Returns True if the current thread/task is executing within an AI advisory context."""
    return _is_advisory_active.get()


@contextmanager
def advisory_context() -> Generator[None, None, None]:
    """
    Context manager activating strict advisory AI isolation.
    Any database write, flush, or state mutation attempted while this context is active
    will immediately raise a RuntimeError via the default-deny interceptor.
    """
    token = _is_advisory_active.set(True)
    try:
        yield
    finally:
        _is_advisory_active.reset(token)


def guardrail_before_flush(session: Session, flush_context, instances):
    """
    SQLAlchemy session-level interceptor.
    Implements a strict DEFAULT-DENY policy:
    If an advisory context is active, ANY attempt to insert, update, or delete ANY entity
    is immediately aborted with a critical security violation error.
    Zero models are allowlisted.
    """
    if is_advisory_active():
        mutations = list(session.new) + list(session.dirty) + list(session.deleted)
        if mutations:
            culprit = mutations[0]
            entity_name = culprit.__class__.__name__
            logger.error(
                f"SECURITY GUARDRAIL INTERCEPTED WRITE ATTEMPT by Advisory AI on entity '{entity_name}'"
            )
            raise RuntimeError(
                f"CRITICAL SECURITY VIOLATION: Advisory AI layer attempted to mutate state on entity '{entity_name}'. "
                "Default-deny policy rejected write. Advisory AI is strictly prohibited from altering trial state."
            )


# Attach default-deny guardrail listener to all SQLAlchemy sessions
event.listen(Session, "before_flush", guardrail_before_flush)


def get_readonly_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency delivering a dialect-aware read-only database session.
    - PostgreSQL: Executes 'SET TRANSACTION READ ONLY' on connection checkout.
    - SQLite: Executes 'PRAGMA query_only = ON' during transaction and resets to OFF upon close.
    Combined with advisory_context(), guarantees three-layer deep defense in depth.
    """
    db = SessionLocal()
    dialect_name = db.bind.dialect.name
    try:
        if dialect_name == "postgresql":
            db.execute(text("SET TRANSACTION READ ONLY"))
        elif dialect_name == "sqlite":
            db.execute(text("PRAGMA query_only = ON"))
        yield db
    finally:
        if dialect_name == "sqlite":
            try:
                db.execute(text("PRAGMA query_only = OFF"))
            except Exception:
                pass
        db.close()
