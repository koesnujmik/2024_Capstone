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

UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 질문을 받을 데이터 모델 정의
class Question(BaseModel):
    question: str

@app.post("/upload/photo")
async def upload_photo(file: UploadFile = File(...)):
    with open(f"uploaded_files/{file.filename}", "wb") as buffer:
        buffer.write(await file.read())
    return JSONResponse(content={"message": "Photo uploaded successfully!"})


# 질문에 대한 응답을 반환하는 API 엔드포인트
@app.post("/ask")
async def ask_question(question: Question):
    with open(os.path.join(UPLOAD_DIR, "text.txt", encoding="utf-8"), "w") as f:
            f.write(question.text)

    # 질문에 대한 응답을 처리하는 로직을 추가
    answer = f"Received your question: '{question.question}'"
    return {"answer": answer}

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