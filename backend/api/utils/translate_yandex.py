import requests
import os

YANDEX_TRANSLATE_URL = os.getenv("YANDEX_TRANSLATE_URL")
YANDEX_API_KEY = os.getenv("YANDEX_API_KEY")
YANDEX_FOLDER_ID = os.getenv("YANDEX_FOLDER_ID")

def batch_translate_lines(lines: list[str]) -> dict[str, str]:
    """ Переводит список строк с английского на русский с помощью Yandex Translate API """
    if not lines:
        return {}

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Api-Key {YANDEX_API_KEY}"
    }

    data = {
        "folderId": YANDEX_FOLDER_ID,
        "texts": lines,
        "targetLanguageCode": "ru",
        "sourceLanguageCode": "en"
    }

    # 👉 Посмотри, что отправляется:
    print("=== SENDING TO YANDEX ===")
    print("Headers:", headers)
    print("Body:", data)

    response = requests.post(YANDEX_TRANSLATE_URL, json=data, headers=headers)
    
    # 👉 Посмотри, что вернулось:
    print("=== YANDEX RESPONSE ===")
    print("Status Code:", response.status_code)
    print("Response JSON:", response.json())
    
    response.raise_for_status()  # если ошибка — выбросит исключение

    result = response.json()
    translated_texts = result.get("translations", [])

    return {original: translated["text"] for original, translated in zip(lines, translated_texts)}