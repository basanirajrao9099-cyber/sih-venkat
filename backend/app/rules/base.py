from abc import ABC, abstractmethod
from typing import Optional
from app.rules.models import RuleDomain, FindingLevel, RuleFinding, RuleContext


class BaseRule(ABC):
    """
    Abstract base class for a clinical governance rule.
    Every rule must define code, title, domain, default finding level, and evaluation logic.
    """
    code: str
    title: str
    domain: RuleDomain
    default_level: FindingLevel
    description: str

    @abstractmethod
    def evaluate(self, ctx: RuleContext) -> Optional[RuleFinding]:
        """
        Evaluate rule against RuleContext.
        Returns RuleFinding if triggered, or None if condition is fully satisfied.
        """
        pass
