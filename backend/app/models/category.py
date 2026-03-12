from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from app.db.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    icon = Column(
        String, nullable=True
    )  # icon name for frontend e.g. "football" "code"

    # Skills in this category
    skills = relationship("Skill", back_populates="category")

    def __repr__(self):
        return f"<Category {self.name}>"
