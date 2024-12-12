from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from typing import Optional
import os
from fastapi.middleware.cors import CORSMiddleware

# FastAPI 인스턴스 생성
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 도메인 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 파일 저장 경로 설정
UPLOAD_DIRECTORY = "./uploaded_files"
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    try:
        file_location = os.path.join("./uploaded_files", file.filename)
        with open(file_location, "wb") as f:
            f.write(await file.read())
        return {"filename": file.filename, "message": "File uploaded successfully!"}
    except Exception as e:
        return {"error": str(e)}

'''
@app.post("/demo/")
async def demo(step: int = Form(...)):
    try:
        # demo.py의 AI 모듈을 호출하여 결과 반환 (가정)
        # 실제 demo.py의 함수 호출 로직으로 대체 필요
        from demo import get_next_step_info  # demo.py 모듈에서 함수 가져오기

        # get_next_step_info는 step 정보를 받아서 결과 반환한다고 가정
        demo_results = get_next_step_info(step)

        # 결과 형태는 {'nextStep': bool, 'caution': Optional[str], 'timer': Optional[int], "responseAudio": Optional[str]}로 가정
        return demo_results
    except ImportError:
        return {"error": "Demo module not found."}
    except Exception as e:
        return {"error": str(e)}
'''
