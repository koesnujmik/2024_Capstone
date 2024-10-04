from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import shutil
import os
from fastapi.middleware.cors import CORSMiddleware
import socket
from datetime import datetime

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

# 파일 이름에 시간을 추가하여 중복 방지
def get_unique_filename(filename: str) -> str:
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return f"{timestamp}_{filename}"

@app.post("/upload/photo")
async def upload_photo(file: UploadFile = File(...)):
    try:
        unique_filename = get_unique_filename(file.filename)
        file_location = os.path.join(UPLOAD_DIR, unique_filename)
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return JSONResponse({"filename": unique_filename, "message": "Photo uploaded successfully"})
    except Exception as e:
        print(f"Error occurred: {e}")
        return JSONResponse(status_code=500, content={"message": "Internal Server Error"})

@app.post("/upload/text")
async def upload_text(text: TextUpload):
    try:
        # 텍스트 파일로 저장
        text_file = os.path.join(UPLOAD_DIR, "text.txt")
        with open(text_file, "w") as f:
            f.write(text.text)
        return JSONResponse(content={"message": "Text uploaded successfully!"})
    except Exception as e:
        print(f"Error occurred: {e}")
        return JSONResponse(status_code=500, content={"message": "Internal Server Error"})

@app.post("/upload/audio")
async def upload_audio(file: UploadFile = File(...)):
    try:
        unique_filename = get_unique_filename(file.filename)
        file_location = os.path.join(UPLOAD_DIR, unique_filename)
        with open(file_location, "wb") as f:
            shutil.copyfileobj(file.file, f)
        return JSONResponse(content={"message": "Audio uploaded successfully!"})
    except Exception as e:
        print(f"Error occurred: {e}")
        return JSONResponse(status_code=500, content={"message": "Internal Server Error"})

# IP 주소 반환 API
@app.get("/get_ip")
async def get_ip():
    hostname = socket.gethostname()
    ip_address = socket.gethostbyname(hostname)
    return {"ip": ip_address}

@app.get("/")
async def read_root():
    return JSONResponse(content={"message": "FastAPI Server is running!"})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
