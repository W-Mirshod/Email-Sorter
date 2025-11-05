from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import json


class EmailRuleBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    conditions: str = Field(..., description="JSON string of conditions")
    actions: str = Field(..., description="JSON string of actions")
    is_active: bool = Field(default=True)
    priority: int = Field(default=0, ge=0)

    @field_validator('conditions', 'actions')
    @classmethod
    def validate_json(cls, v: str) -> str:
        """Validate that conditions and actions are valid JSON"""
        try:
            json.loads(v)
        except json.JSONDecodeError:
            raise ValueError("Must be valid JSON string")
        return v


class EmailRuleCreate(EmailRuleBase):
    pass


class EmailRuleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    conditions: Optional[str] = None
    actions: Optional[str] = None
    is_active: Optional[bool] = None
    priority: Optional[int] = Field(None, ge=0)

    @field_validator('conditions', 'actions')
    @classmethod
    def validate_json(cls, v: Optional[str]) -> Optional[str]:
        """Validate that conditions and actions are valid JSON"""
        if v is not None:
            try:
                json.loads(v)
            except json.JSONDecodeError:
                raise ValueError("Must be valid JSON string")
        return v


class EmailRuleResponse(EmailRuleBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class EmailTemplateBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    subject: str = Field(..., min_length=1, max_length=500)
    body: str = Field(..., min_length=1)
    category: str = Field(default="general", max_length=100)


class EmailTemplateCreate(EmailTemplateBase):
    pass


class EmailTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    subject: Optional[str] = Field(None, min_length=1, max_length=500)
    body: Optional[str] = Field(None, min_length=1)
    category: Optional[str] = Field(None, max_length=100)


class EmailTemplateResponse(EmailTemplateBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class StatsResponse(BaseModel):
    total_rules: int
    active_rules: int
    inactive_rules: int
    total_templates: int
    templates_by_category: Dict[str, int]


class ErrorResponse(BaseModel):
    detail: str
