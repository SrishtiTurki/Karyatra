from typing import List, Dict, Optional, Union
from datetime import datetime
from pydantic import BaseModel, Field, HttpUrl

class ResourceBase(BaseModel):
    """Base model for resource objects"""
    title: str
    url: HttpUrl
    description: Optional[str] = None
    source: str
    resource_type: str
    tags: List[str] = []
    
class Resource(ResourceBase):
    """Database model for stored resources"""
    id: Optional[str] = None
    skill: str
    rating: float = 0.0
    num_ratings: int = 0
    active: bool = True
    added_date: datetime = Field(default_factory=datetime.now)

class ResourceFeedback(BaseModel):
    """Model for user feedback on resources"""
    resource_id: str
    user_id: str
    rating: Optional[int] = None
    helpful: Optional[bool] = None
    comments: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)

class UserPreferences(BaseModel):
    """Model for user preferences for personalization"""
    preferred_types: List[str] = []
    preferred_sources: List[str] = []
    experience_level: str = "beginner"
    interests: List[str] = []