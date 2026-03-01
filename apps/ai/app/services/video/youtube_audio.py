"""YouTube audio download service using yt-dlp"""

import asyncio
import tempfile
import os
import structlog
from pathlib import Path
from typing import Optional, Tuple

import yt_dlp

from app.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


class YouTubeAudioDownloader:
    """Download audio from YouTube videos using yt-dlp"""

    def __init__(self):
        self.max_duration_minutes = settings.stt_max_duration_minutes

    async def download_audio(self, video_id: str) -> Tuple[Optional[bytes], Optional[int]]:
        """
        Download audio from YouTube video

        Args:
            video_id: YouTube video ID

        Returns:
            Tuple of (audio_bytes, duration_seconds) or (None, None) on failure
        """
        video_url = f"https://www.youtube.com/watch?v={video_id}"

        logger.info("youtube_audio_download_start", video_id=video_id)

        try:
            # Create temp directory for download
            with tempfile.TemporaryDirectory() as temp_dir:
                output_path = os.path.join(temp_dir, "audio")

                ydl_opts = {
                    'format': 'bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio/best',
                    'outtmpl': output_path + '.%(ext)s',
                    'quiet': True,
                    'no_warnings': True,
                    'extract_audio': True,
                    'noplaylist': True,
                    # Bypass age gate and bot detection
                    'age_limit': None,
                    'geo_bypass': True,
                    'nocheckcertificate': True,
                }

                def _extract_info(url: str, ydl_opts: dict) -> dict | None:
                    """Blocking call to yt-dlp extract_info"""
                    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                        return ydl.extract_info(url, download=False)

                def _download(url: str, ydl_opts: dict) -> None:
                    """Blocking call to yt-dlp download"""
                    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                        ydl.download([url])

                # Get video info first to check duration (run in thread)
                info = await asyncio.to_thread(_extract_info, video_url, ydl_opts)

                if not info:
                    logger.error("youtube_audio_info_failed", video_id=video_id)
                    return None, None

                duration_seconds = info.get('duration', 0)
                max_duration_seconds = self.max_duration_minutes * 60

                if duration_seconds > max_duration_seconds:
                    logger.warn(
                        "youtube_audio_duration_exceeded",
                        video_id=video_id,
                        duration=duration_seconds,
                        max_duration=max_duration_seconds
                    )
                    return None, duration_seconds

                # Download the audio (run in thread)
                await asyncio.to_thread(_download, video_url, ydl_opts)

                # Find the downloaded file
                audio_file = None
                for file in Path(temp_dir).iterdir():
                    if file.is_file() and file.suffix in ['.m4a', '.webm', '.mp3', '.ogg', '.opus']:
                        audio_file = file
                        break

                if not audio_file:
                    logger.error("youtube_audio_file_not_found", video_id=video_id)
                    return None, None

                # Read the audio file
                audio_bytes = audio_file.read_bytes()

                logger.info(
                    "youtube_audio_download_complete",
                    video_id=video_id,
                    size_mb=round(len(audio_bytes) / 1024 / 1024, 2),
                    duration=duration_seconds
                )

                return audio_bytes, duration_seconds

        except yt_dlp.utils.DownloadError as e:
            logger.error("youtube_audio_download_error", video_id=video_id, error=str(e))
            return None, None
        except Exception as e:
            logger.error("youtube_audio_unexpected_error", video_id=video_id, error=str(e))
            return None, None

    def is_within_limit(self, duration_seconds: int) -> bool:
        """Check if duration is within STT limit"""
        return duration_seconds <= self.max_duration_minutes * 60
