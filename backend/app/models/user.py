from pydantic import ConfigDict
from sqlalchemy import JSON
from sqlmodel import Field, SQLModel


class UserProfile(SQLModel, table=True):
    model_config = ConfigDict(from_attributes=True, title="User Profile")  # type: ignore

    __tablename__ = "user_profile"
    id: str = Field(max_length=36, primary_key=True, index=True, description="Unique user identifier")
    name: str = Field(max_length=50, unique=True, nullable=False, description="User's display name")
    avatar: str | None = Field(max_length=255, nullable=True, description="URL to user's avatar image")


class LLMResponse(SQLModel, table=True):
    model_config = ConfigDict(from_attributes=True, title="LLM Response")  # type: ignore

    __tablename__ = "llm_result"
    id: str = Field(max_length=36, primary_key=True, index=True, description="Unique task identifier")
    llmResponse: dict = Field(sa_type=JSON, description="LLM response data")  # noqa: N815
