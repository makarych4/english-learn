# Generated by Django 5.1.6 on 2025-04-09 19:34

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0009_rename_lyrics_text_song_search_text'),
    ]

    operations = [
        migrations.AddField(
            model_name='song',
            name='is_published',
            field=models.BooleanField(default=False),
        ),
    ]
