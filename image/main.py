from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import shutil
import os
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 필요한 도메인으로 설정
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"  # 사진을 저장할 폴더 경로
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/upload-photo/")
async def upload_photo(file: UploadFile = File(...)):
    print(f"Received file: {file.filename} of size {file.size}")
    contents = await file.read()
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return JSONResponse({"filename": file.filename, "message": "Photo uploaded successfully"})
