from fastapi import FastAPI, File, UploadFile
import os
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl, Field
from typing import List, Optional
from fastapi.responses import JSONResponse

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

class HowToStep(BaseModel):
    type: str = Field(..., alias='@type')  # Use alias to map @type to type
    text: str
    image: str

class Recipe(BaseModel):
    name: str
    recipeIngredient: List[str] # Map 'ingredients' from JSON
    recipeInstructions: List[HowToStep]  # Map 'instructions' from JSON

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    try:
        file_location = os.path.join("./uploaded_files", file.filename)
        with open(file_location, "wb") as f:
            f.write(await file.read())
        return {"filename": file.filename, "message": "File uploaded successfully!"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/send-recipe")
async def send_recipe(recipe: Recipe):
    print(recipe)  # Add this line to log the received data
    return JSONResponse(content={"message": "Recipe successfully received", "recipe": recipe.dict()})

