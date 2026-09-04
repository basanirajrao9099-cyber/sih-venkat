from sqlalchemy import Column, String, ForeignKey, JSON
from app.database import Base


class ProtocolEndpoint(Base):
    __tablename__ = "protocol_endpoints"

    id = Column(String(64), primary_key=True, index=True) # e.g. "ep-01"
    trial_id = Column(String(64), ForeignKey("trials.trial_id"), nullable=False, index=True)
    type = Column(String(32), nullable=False) # 'Primary' | 'Secondary' | 'Exploratory'
    description = Column(String(512), nullable=False)
    timeframe = Column(String(255), nullable=False)
    measurement_tool = Column(String(255), nullable=False)


class ScheduleOfAssessment(Base):
    __tablename__ = "schedule_of_assessments"

    id = Column(String(64), primary_key=True, index=True)
    trial_id = Column(String(64), ForeignKey("trials.trial_id"), nullable=False, index=True)
    visit_id = Column(String(32), nullable=False) # "V1", "V2", etc.
    visit_name = Column(String(255), nullable=False) # "Mid-Point Evaluation (Week 8)"
    day_offset = Column(String(64), nullable=False) # "Day 56"
    window_days = Column(String(64), nullable=False) # "±3 days"
    activities = Column(JSON, default=list)
