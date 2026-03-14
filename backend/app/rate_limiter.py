import time
from collections import defaultdict
from fastapi import HTTPException, Request


class RateLimiter:
    """Simple in-memory rate limiter using sliding window."""

    def __init__(self):
        self._requests: dict[str, list[float]] = defaultdict(list)

    def _cleanup(self, key: str, window: int):
        now = time.time()
        self._requests[key] = [t for t in self._requests[key] if now - t < window]

    def check(self, key: str, max_requests: int, window_seconds: int):
        self._cleanup(key, window_seconds)
        if len(self._requests[key]) >= max_requests:
            minutes = window_seconds // 60
            raise HTTPException(
                status_code=429,
                detail=f"יותר מדי ניסיונות. נסה שוב בעוד {minutes} דקות."
            )
        self._requests[key].append(time.time())


rate_limiter = RateLimiter()


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
