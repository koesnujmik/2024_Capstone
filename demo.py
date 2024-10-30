import os
import base64
from openai import OpenAI

# 환경 변수에 OpenAI API 키 설정
os.environ["OPENAI_API_KEY"] = "1"  # Enter your OpenAI Key
client = OpenAI()

# 기본 프롬프트
prompt = """당신은 요리 도우미입니다. 사용자가 요리에 관한 질문과 함께 이미지를 보내면, 이미지를 참고하여 한국어로 간결하고 유익한 답변을 제공합니다. 
답변에는 특수기호를 사용하지 말고, 음성으로 이해하기 쉽게 설명합니다."""

def response(user_image_url, user_message):
    assistant = client.beta.assistants.create(
        name = 'cook assistant',
        instructions = prompt,
        model="gpt-4o-mini-2024-07-18",
    )

    thread = client.beta.threads.create()

    thread_message = client.beta.threads.messages.create(
        thread_id=thread.id,
        role="user",
        content=[{"type": "text", "text": user_message},
        {
          "type": "image_url",
          "image_url": {
            "url": user_image_url,
          },
        },
        ]
    ) 

    run = client.beta.threads.runs.create_and_poll(
        thread_id=thread.id,
        assistant_id=assistant.id,
    )

    messages = list(client.beta.threads.messages.list(thread_id=thread.id, run_id=run.id))

    message_content = messages[0].content[0].text

    return message_content.value


# 현재 파일의 디렉토리 경로
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # 'venv' 폴더의 경로
PARENT_DIR = os.path.dirname(BASE_DIR)  # 'py' 폴더의 경로

# assets 폴더의 절대 경로
SAVE_DIR = os.path.join(PARENT_DIR, "..", "beta", "assets", "sound")  # 'beta/asset' 폴더의 경로

audio_file_path = os.path.join(SAVE_DIR, "input.wav")  # 절대 경로로 설정
audio_file= open(audio_file_path, "rb")
transcription = client.audio.transcriptions.create(
  model="whisper-1", 
  file=audio_file
)
print(transcription.text)

user_message = transcription.text
user_image_url = "https://recipe1.ezmember.co.kr/cache/recipe/2017/04/03/af672abe3054185420dda8c0c0f826561.jpg"

content = response(user_image_url, user_message)
print("AI Response:", content)

output_audio_path = os.path.join(SAVE_DIR, "output.mp3")  # 출력 파일 경로

from gtts import gTTS
if content:
    tts = gTTS(content)
    tts.save(output_audio_path)
    print("Audio file saved at:", output_audio_path)
else:
    print("No content to convert to audio.")

# pip install gTTS

tts = gTTS(content)
tts.save(output_audio_path)  # 절대 경로로 저장