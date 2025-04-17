from ytmusicapi import YTMusic

ytmusic = YTMusic()

def get_youtube_music_id(title, artist):
    results = ytmusic.search(f"{artist} {title}", filter="songs")
    for result in results:
        if result["resultType"] == "song":
            return result.get("videoId")
    return None
