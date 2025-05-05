from sqlalchemy import create_engine
from ..config.constants import DATABASE_URL

engine = create_engine(url=DATABASE_URL)