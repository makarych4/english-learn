from rest_framework.pagination import PageNumberPagination

class SongPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50

class WordFrequencyPagination(PageNumberPagination):
    page_size = 10  # Количество слов на страницу
    page_size_query_param = "page_size"