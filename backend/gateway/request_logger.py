import sqlite3
import time
import asyncio
from typing import Optional
from datetime import datetime

class RequestLogger:
    def __init__(self, db_path: str = "samai.db"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS api_audit_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT,
                    client_ip TEXT,
                    api_key TEXT,
                    endpoint TEXT,
                    method TEXT,
                    response_status INTEGER,
                    response_time_ms REAL
                )
            ''')
            conn.commit()

    async def log_request(self, client_ip: str, api_key: Optional[str], endpoint: str, 
                          method: str, response_status: int, response_time_ms: float):
        timestamp = datetime.utcnow().isoformat()
        
        # Run DB write in a separate thread to avoid blocking the async loop
        await asyncio.to_thread(self._insert_log, timestamp, client_ip, api_key, 
                                endpoint, method, response_status, response_time_ms)

    def _insert_log(self, timestamp, client_ip, api_key, endpoint, method, response_status, response_time_ms):
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO api_audit_logs 
                    (timestamp, client_ip, api_key, endpoint, method, response_status, response_time_ms)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (timestamp, client_ip, api_key, endpoint, method, response_status, response_time_ms))
                conn.commit()
        except sqlite3.Error as e:
            print(f"Failed to write audit log: {e}")

    def get_statistics(self) -> list:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute('''
                SELECT endpoint, method, COUNT(*) as count, AVG(response_time_ms) as avg_response_time
                FROM api_audit_logs
                GROUP BY endpoint, method
            ''')
            return [dict(row) for row in cursor.fetchall()]
