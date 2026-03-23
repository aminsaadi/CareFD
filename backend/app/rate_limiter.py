import time
import threading
from collections import defaultdict
from fastapi import HTTPException, Request


class RateLimiter:
    """Thread-safe in-memory rate limiter using sliding window with periodic cleanup."""

    def __init__(self):
        self._requests: dict[str, list[float]] = defaultdict(list)
        self._lock = threading.Lock()
        self._last_global_cleanup = time.time()
        self._global_cleanup_interval = 300  # Clean all keys every 5 minutes

    def _cleanup(self, key: str, window: int):
        now = time.time()
        self._requests[key] = [t for t in self._requests[key] if now - t < window]

    def _global_cleanup(self):
        """Remove stale keys to prevent memory growth."""
        now = time.time()
        if now - self._last_global_cleanup < self._global_cleanup_interval:
            return
        self._last_global_cleanup = now
        stale_keys = [k for k, v in self._requests.items() if not v or (now - max(v)) > 3600]
        for k in stale_keys:
            del self._requests[k]

    def check(self, key: str, max_requests: int, window_seconds: int):
        with self._lock:
            self._cleanup(key, window_seconds)
            self._global_cleanup()
            if len(self._requests[key]) >= max_requests:
                raise HTTPException(
                    status_code=429,
                    detail="יותר מדי ניסיונות. נסה שוב מאוחר יותר."
                )
            self._requests[key].append(time.time())


rate_limiter = RateLimiter()


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        # Take the first (client) IP, strip whitespace
        ip = forwarded.split(",")[0].strip()
        # Basic validation - reject obviously invalid IPs
        if ip and len(ip) <= 45:  # Max IPv6 length
            return ip
    return request.client.host if request.client else "unknown"
