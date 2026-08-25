import time
import threading

class RateLimiter:
    def __init__(self, requests_per_minute=60, requests_per_hour=1000):
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self.lock = threading.Lock()
        self.minute_buckets = {}
        self.hour_buckets = {}

    def _cleanup(self, current_time):
        minute_window = current_time - 60
        hour_window = current_time - 3600
        
        for key in list(self.minute_buckets.keys()):
            self.minute_buckets[key] = [t for t in self.minute_buckets[key] if t > minute_window]
            if not self.minute_buckets[key]:
                del self.minute_buckets[key]

        for key in list(self.hour_buckets.keys()):
            self.hour_buckets[key] = [t for t in self.hour_buckets[key] if t > hour_window]
            if not self.hour_buckets[key]:
                del self.hour_buckets[key]

    def is_allowed(self, key: str) -> bool:
        with self.lock:
            current_time = time.time()
            self._cleanup(current_time)

            minute_history = self.minute_buckets.get(key, [])
            hour_history = self.hour_buckets.get(key, [])

            if len(minute_history) >= self.requests_per_minute or len(hour_history) >= self.requests_per_hour:
                return False

            self.minute_buckets.setdefault(key, []).append(current_time)
            self.hour_buckets.setdefault(key, []).append(current_time)
            return True

    def get_remaining(self, key: str) -> dict:
        with self.lock:
            current_time = time.time()
            self._cleanup(current_time)

            minute_history = self.minute_buckets.get(key, [])
            hour_history = self.hour_buckets.get(key, [])

            return {
                "minute_remaining": max(0, self.requests_per_minute - len(minute_history)),
                "hour_remaining": max(0, self.requests_per_hour - len(hour_history))
            }
