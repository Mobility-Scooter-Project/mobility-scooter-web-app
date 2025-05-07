import psycopg
import ray
from utils.logger import logger
from config.constants import DATABASE_URL

@ray.remote
class DBActor():
    def __init__(self):
        self.connection = None
        self.cursor = None
        
    def _lazyInit(self):
        """
        Lazily initializes the database connection and cursor.

        This method checks if the database connection and cursor are set. If either is missing,
        it attempts to establish a new connection using DATABASE_URL and creates a new cursor
        from that connection. If the connection attempt fails, it logs an error message with
        the relevant exception details.

        Raises:
            Exception: If there is an error during the database connection initialization.
        """
        if not self.connection or not self.cursor:
            try:
                self.connection = psycopg.connect(DATABASE_URL)
                self.cursor = self.connection.cursor()
            except Exception as e:
                logger.error(f"Failed to connect to db: {e}")
        
    def upsert_keypoints(self, id, video_id, timestamp, angle, keypoints):
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
        self._lazyInit()
        query = """
            INSERT INTO storage.keypoints (video_id, timestamp, angle, keypoints)
            VALUES (%s, %s, %s, %s)
        """
        try:
            self.cursor.execute(query, (video_id, timestamp, angle, keypoints))
        except Exception as e:
            logger.error(f"Failed to upload keypoints to database: {e}")
        else:
            self.connection.commit()
            
    def upsert_task(self, video_id, task_id, task):
        """
        Inserts or updates a task record in the "storage.tasks" table in the database.
        This method lazily initializes the database connection and constructs an SQL INSERT query to add a task
        associated with a given video. It accepts a video identifier, a task identifier, and the task details.
        If the execution of the query fails, an error is logged; otherwise, the transaction is committed.
        Parameters:
            video_id: The identifier for the video.
            task_id: The unique identifier for the task.
            task: The task details to be stored.
        Raises:
            Logs an error if there is an exception during query execution.
        """
        self._lazyInit()
        query = """
        INSERT INTO storage.tasks (video_id, task, task_id)
        VALUES (%s, %s, %s);
        """
        
        try:
            self.cursor.execute(query, (video_id, task, task_id))
        except Exception as e:
            logger.error(f"Failed to upsert task {task_id} for video f{video_id}: {e}")
        else:
            self.connection.commit()
    
    def update_processing_status(self, video_id, status):
        """
        Update the processing status of a video.

        This method performs a two-step database operation:
        1. Inserts a new event with the provided status into the storage.events table,
            retrieving the generated event ID.
        2. Updates the storage.metadata table for the specified video by linking it
            to the new event via its ID.

        Parameters:
             video_id (int or str): The unique identifier for the video to update.
             status (Any): The processing status to record, which is inserted into
                                the events table.

        Exceptions:
             Logs an error if the execution of the database commands fails.
        """
        self._lazyInit()
        query = """
                    WITH new_event AS (
                        INSERT INTO storage.events (status) VALUES (%s) RETURNING id
                    )
                    UPDATE storage.metadata
                    SET status_event_id = (SELECT id FROM new_event)
                    WHERE id = %s;
                """
        try:
            self._lazyInit()
            self.cursor.execute(query, (status, video_id))
        except Exception as e:
            logger.error(f"Failed to update video processing status: {e}")
        else:
            self.connection.commit()
        
        