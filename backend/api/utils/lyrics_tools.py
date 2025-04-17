import lyricsgenius
import os

GENIUS_API_KEY = os.getenv("GENIUS_API_KEY")

genius = lyricsgenius.Genius(GENIUS_API_KEY)
genius.skip_non_songs = True
genius.excluded_terms = ["(Remix)", "(Live)"]
genius.remove_section_headers = True

def get_genius():

    return genius
