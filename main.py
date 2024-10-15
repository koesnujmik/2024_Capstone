from fastapi import FastAPI, File, UploadFile, HTTPException
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

UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/upload/photo")
async def upload_photo(file: UploadFile = File(...)):
    try:
        # 파일 저장 경로 설정
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        
        # 파일을 바이너리 쓰기 모드로 열고 저장합니다.
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
            
        print(f"Saved file at: {file_path}")  # 파일 저장 경로 확인 로그
        return JSONResponse(content={"message": "Photo uploaded successfully!"})

    except Exception as e:
        print("Error occurred while uploading the photo:", str(e))  # 오류 메시지 출력
        raise HTTPException(status_code=500, detail="Internal Server Error: " + str(e))

# 질문을 받을 데이터 모델 정의
class Question(BaseModel):
    text: str

# 질문에 대한 응답을 반환하는 API 엔드포인트
@app.post("/ask")
async def ask_question(question: Question):
    try:
        file_path = os.path.join(UPLOAD_DIR, "text.txt")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(question.text)

        # 질문에 대한 응답을 처리하는 로직을 추가
        answer = f"Received your question: '{question.text}'"
        return {"answer": answer}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
