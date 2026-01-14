"""Tests for input validation"""

import pytest
from pydantic import ValidationError

# Need to set env before importing
import os
os.environ["OPENAI_API_KEY"] = "sk-test"

from app.models import (
    VideoMetadata,
    AnalyzeRequest,
    STTSegment,
)


class TestVideoMetadataValidation:
    """Tests for VideoMetadata validation"""

    def test_valid_metadata(self):
        """Test valid metadata passes validation"""
        metadata = VideoMetadata(
            title="테스트 제목",
            channelName="테스트 채널",
            description="테스트 설명"
        )
        assert metadata.title == "테스트 제목"
        assert metadata.channel_name == "테스트 채널"

    def test_title_required(self):
        """Test title is required"""
        with pytest.raises(ValidationError):
            VideoMetadata(channelName="채널")

    def test_channel_required(self):
        """Test channel name is required"""
        with pytest.raises(ValidationError):
            VideoMetadata(title="제목")

    def test_title_max_length(self):
        """Test title max length validation"""
        with pytest.raises(ValidationError):
            VideoMetadata(
                title="가" * 250,
                channelName="채널"
            )

    def test_title_stripped(self):
        """Test title is stripped of whitespace"""
        metadata = VideoMetadata(
            title="  테스트 제목  ",
            channelName="채널"
        )
        assert metadata.title == "테스트 제목"

    def test_empty_title_fails(self):
        """Test empty title fails validation"""
        with pytest.raises(ValidationError):
            VideoMetadata(
                title="",
                channelName="채널"
            )

    def test_description_optional(self):
        """Test description is optional"""
        metadata = VideoMetadata(
            title="제목",
            channelName="채널"
        )
        assert metadata.description == ""


class TestSTTSegmentValidation:
    """Tests for STTSegment validation"""

    def test_valid_segment(self):
        """Test valid segment passes validation"""
        segment = STTSegment(start=0.0, end=5.0, text="테스트")
        assert segment.start == 0.0
        assert segment.end == 5.0

    def test_negative_start_fails(self):
        """Test negative start time fails"""
        with pytest.raises(ValidationError):
            STTSegment(start=-1.0, end=5.0, text="테스트")

    def test_negative_end_fails(self):
        """Test negative end time fails"""
        with pytest.raises(ValidationError):
            STTSegment(start=0.0, end=-1.0, text="테스트")

    def test_end_before_start_fails(self):
        """Test end before start fails"""
        with pytest.raises(ValidationError):
            STTSegment(start=10.0, end=5.0, text="테스트")


class TestAnalyzeRequestValidation:
    """Tests for AnalyzeRequest validation"""

    def test_valid_request(self):
        """Test valid request passes validation"""
        request = AnalyzeRequest(
            metadata=VideoMetadata(
                title="제목",
                channelName="채널"
            ),
            transcript="자막 텍스트"
        )
        assert request.transcript == "자막 텍스트"

    def test_transcript_optional(self):
        """Test transcript is optional"""
        request = AnalyzeRequest(
            metadata=VideoMetadata(
                title="제목",
                channelName="채널"
            )
        )
        assert request.transcript is None

    def test_segments_optional(self):
        """Test segments are optional"""
        request = AnalyzeRequest(
            metadata=VideoMetadata(
                title="제목",
                channelName="채널"
            )
        )
        assert request.segments is None
