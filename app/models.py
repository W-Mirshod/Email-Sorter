from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.sql import func
from .database import Base

class EmailRule(Base):
    __tablename__ = "email_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    conditions = Column(Text)  # JSON string of conditions
    actions = Column(Text)     # JSON string of actions
    is_active = Column(Boolean, default=True)
    priority = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class EmailTemplate(Base):
    __tablename__ = "email_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    subject = Column(String)
    body = Column(Text)
    category = Column(String, default="general")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
