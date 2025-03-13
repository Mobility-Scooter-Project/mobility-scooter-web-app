from fastapi import FastAPI
from fastapi.responses import PlainTextResponse

app = FastAPI()

@app.get("/healthcheck", response_class=PlainTextResponse)
async def healthcheck():
    return "OK"