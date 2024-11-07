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




user_image_url = "https://recipe1.ezmember.co.kr/cache/recipe/2017/04/03/af672abe3054185420dda8c0c0f826561.jpg"