from pydantic import BaseModel, field_validator
import re


class UserResponse(BaseModel):
    id: str
    username: str
    full_name: str


class UserSearchResponse(BaseModel):
    id: str
    username: str
    full_name: str
