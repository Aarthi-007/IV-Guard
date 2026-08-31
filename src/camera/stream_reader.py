"""
Stream reader module for parsing incoming video chunks (e.g. MJPEG/RTSP) into OpenCV frames.
"""


class StreamReader:
    """Decodes live network stream chunks into discrete OpenCV image frames."""

    def __init__(self, stream_response, chunk_size: int = 1024):
        self.stream_response = stream_response
        self.chunk_size = chunk_size

    def read_frame(self):
        """Extract and decode the next complete JPEG frame from the byte stream."""
        raise NotImplementedError("StreamReader.read_frame() will be implemented in future milestones.")
