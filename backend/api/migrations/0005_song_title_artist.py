# Generated by Django 5.1.6 on 2025-04-03 15:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_song_search_text_song_youtube_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='song',
            name='title_artist',
            field=models.TextField(blank=True, null=True),
        ),
    ]
