from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import shutil
import time
import os
from fastapi.middleware.cors import CORSMiddleware
from demo import response, user_image_url  # AI 모듈에서 함수 import
from openai import OpenAI
from gtts import gTTS
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

# 현재 파일의 디렉토리 경로
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # 'venv' 폴더의 경로
PARENT_DIR = os.path.dirname(BASE_DIR)  # 'py' 폴더의 경로

# assets 폴더의 절대 경로
UPLOAD_DIR = os.path.abspath(os.path.join(PARENT_DIR, "..", "beta", "assets", "sound"))  # 'beta/asset/sound'의 절대 경로
# 정적 파일 경로 설정 (업로드 폴더의 파일을 제공하기 위해 사용)
app.mount("/assets/sound", StaticFiles(directory=UPLOAD_DIR), name="assets_sound")
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
        # 오디오 파일 저장
        file_location = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_location, "wb") as f:
            shutil.copyfileobj(file.file, f)

        # OpenAI로 오디오 파일을 텍스트로 변환
        client = OpenAI()
        with open(file_location, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file
            )
        user_message = transcription.text

        # AI 응답 생성
        user_image_url = "https://recipe1.ezmember.co.kr/cache/recipe/2017/04/03/af672abe3054185420dda8c0c0f826561.jpg"  # 예제 이미지 URL
        content = response(user_image_url, user_message)
        print("AI Response:", content)

        # 응답을 오디오 파일로 저장
        output_audio_path = os.path.join(UPLOAD_DIR, "output.mp3")
        if content:
            tts = gTTS(content, lang="ko")
            tts.save(output_audio_path)
            print("Audio file saved at:", output_audio_path)
        else:
            return JSONResponse(content={"message": "No content to convert to audio."})

    except Exception as e:
        print(f"Error occurred: {e}")
        return JSONResponse(status_code=500, content={"message": "Internal Server Error", "error": str(e)})

    return JSONResponse(content={"message": "File processed", "audio_url": f"/audio/output.mp3?timestamp={int(time.time())}"})


# 오디오 파일 반환 엔드포인트
@app.get("/audio/output.mp3")
def get_output_audio():
    output_audio_path = os.path.join(UPLOAD_DIR, "output.mp3")
    if os.path.exists(output_audio_path):
        return FileResponse(output_audio_path, media_type="audio/mpeg", headers={"Cache-Control": "no-cache"})
    else:
        return JSONResponse(status_code=404, content={"message": "File not found"})
    


@app.get("/")
async def read_root():
    return JSONResponse(content={"message": "FastAPI Server is running!"})