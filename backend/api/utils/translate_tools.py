from deep_translator import MyMemoryTranslator
import os

EMAIL = os.getenv("EMAIL")
translator = MyMemoryTranslator(source='en-US', target='ru-RU', email=EMAIL)

_translation_cache = {}

def batch_translate_lines(lines: list[str]) -> dict[str, str]:
    """Переводит список строк по одной и возвращает {original: translated}"""

    result = {}

    for line in lines:
        original = line.strip()
        if not original:
            continue

        if original in _translation_cache:
            result[original] = _translation_cache[original]
            continue

        try:
            translated = translator.translate(original)
            _translation_cache[original] = translated
            result[original] = translated
        except Exception as e:
            print(f"Ошибка перевода строки: '{original}': ", e)
            result[original] = ""

    return result






"""Перевод с API от Яндекса"""

# import requests
# import os

# IAM_TOKEN = os.getenv("YANDEX_IAM_TOKEN")
# YANDEX_FOLDER_ID = os.getenv("YANDEX_FOLDER_ID")

# def translate_line(line, source_language="en", target_language="ru"):
#     url = "https://translate.api.cloud.yandex.net/translate/v2/translate"
    
#     body = {
#         "sourceLanguageCode": source_language,
#         "targetLanguageCode": target_language,
#         "texts": [line],
#         "folderId": YANDEX_FOLDER_ID,
#     }

#     headers = {
#         "Content-Type": "application/json",
#         "Authorization": f"Bearer {IAM_TOKEN}",  # Изменили схему авторизации
#     }

#     response = requests.post(url, json=body, headers=headers)
    
#     if response.status_code != 200:
#         print(f"HTTP Error: {response.status_code}, Response: {response.text}")
#         return ""

#     try:
#         return response.json()["translations"][0]["text"]
#     except (KeyError, IndexError) as e:
#         print(f"Ошибка обработки ответа: {e} | Ответ: {response.json()}")
#         return ""