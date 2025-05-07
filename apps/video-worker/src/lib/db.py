import psycopg
import ray
import os
from utils.logger import logger
from config.constants import DATABASE_URL

@ray.remote
class DBActor():
    def __init__(self):
        self.connection = None
        self.cursor = None
        
    def _lazyInit(self):
        if not self.connection or not self.cursor:
            try:
                self.connection = psycopg.connect(DATABASE_URL)
                self.cursor = self.connection.cursor()
            except Exception as e:
                logger.error(f"Failed to connect to db: {e}")
        
    def upsert_keypoints(self, videoId, timestamp, angle, keypoints):
        """
        Insert keypoints data into the database for the specified video at a given timestamp.

        Parameters:
            videoId (str): Unique identifier for the video.
            timestamp (Any): The timestamp at which the keypoints are recorded.
            angle (Any): Provided angle value corresponding to the keypoints (currently unused in the database query).
            keypoints (Any): The keypoints data structure to insert.

        Raises:
            Exception: Logs an error if the database insertion fails.

        Notes:
            - This method initializes the database connection lazily via self._lazyInit().
            - Although named "upsert_keypoints", the current implementation performs an insert.
            - A TODO is noted to modify the schema for proper upsertion on retry, possibly by
              converting the schema from UUID to a sequential identifier.
        """
        # TODO: convert schema to sequential instead of uuid for proper upsertion on retry
        self._lazyInit()
        query = """
            INSERT INTO storage.keypoints (video_id, timestamp, keypoints)
            VALUES (%s, %s, %s)
        """
        try:
            self.cursor.execute(query, (videoId, timestamp, keypoints))
        except Exception as e:
            logger.error(f"Failed to upload keypoints to database: {e}")
        else:
            self.connection.commit()
        
        