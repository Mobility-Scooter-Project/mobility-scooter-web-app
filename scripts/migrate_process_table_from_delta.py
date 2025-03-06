from dotenv import load_dotenv
import os
import json
from globus_sdk import ClientApp, TransferClient
load_dotenv()

CLIENT_ID = os.getenv("GLOBUS_CLIENT_ID")
CLIENT_SECRET = os.getenv("GLOBUS_CLIENT_SECRET")
ENDPOINT_ID = os.getenv("GLOBUS_ENDPOINT_ID")

# Create a client app and transfer client instance
app = ClientApp("Migration Script", client_id=CLIENT_ID, client_secret=CLIENT_SECRET)
transfer_client = TransferClient(app=app).add_app_data_access_scope(ENDPOINT_ID)

ls = transfer_client.operation_ls(ENDPOINT_ID)
print(ls)
