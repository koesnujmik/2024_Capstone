from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import shutil
import os
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 텍스트 업로드를 위한 Pydantic 모델
class TextUpload(BaseModel):
    text: str  # JSON 형식으로 받는 텍스트 필드

@app.post("/upload/photo")
async def upload_photo(file: UploadFile = File(...)):
    try:
        print(f"Received file: {file.filename} of size {file.size}")
        file_location = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return JSONResponse({"filename": file.filename, "message": "Photo uploaded successfully"})
    except Exception as e:
        print(f"Error occurred: {e}")
        return JSONResponse(status_code=500, content={"message": "Internal Server Error"})

@app.post("/upload/text")
async def upload_text(text: TextUpload):
    try:
        # 텍스트 파일로 저장
        with open(os.path.join(UPLOAD_DIR, "text.txt"), "w") as f:
            f.write(text.text)
        return JSONResponse(content={"message": "Text uploaded successfully!"})
    except Exception as e:
        print(f"Error occurred: {e}")
        return JSONResponse(status_code=500, content={"message": "Internal Server Error"})

@app.post("/upload/audio")
async def upload_audio(file: UploadFile = File(...)):
    try:
        file_location = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_location, "wb") as f:
            shutil.copyfileobj(file.file, f)
        return JSONResponse(content={"message": "Audio uploaded successfully!"})
    except Exception as e:
        print(f"Error occurred: {e}")
        return JSONResponse(status_code=500, content={"message": "Internal Server Error"})

@app.get("/")
async def read_root():
    return JSONResponse(content={"message": "FastAPI Server is running!"})
