import os
import requests
from datetime import datetime, timedelta

class ProKeralaAPI:
    def __init__(self):
        self.client_id = os.getenv("PROKERALA_CLIENT_ID")
        self.client_secret = os.getenv("PROKERALA_CLIENT_SECRET")
        self.token = None
        self.token_expiry = None

    def get_token(self):
        if self.token and self.token_expiry and datetime.now() < self.token_expiry:
            return self.token
            
        url = "https://api.prokerala.com/token"
        payload = {
            "grant_type": "client_credentials",
            "client_id": self.client_id,
            "client_secret": self.client_secret
        }
        response = requests.post(url, data=payload)
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("access_token")
            expires_in = data.get("expires_in", 3600)
            self.token_expiry = datetime.now() + timedelta(seconds=expires_in - 60)
            return self.token
        else:
            print(f"ProKerala Auth Error: {response.text}")
            return None

    def get_panchang(self, lat: float, lon: float, date_iso: str):
        token = self.get_token()
        if not token:
            return {"error": "Authentication failed"}
            
        url = "https://api.prokerala.com/v2/astrology/panchang"
        headers = {"Authorization": f"Bearer {token}"}
        params = {
            "ayanamsa": 1, # Lahiri
            "coordinates": f"{lat},{lon}",
            "datetime": date_iso
        }
        response = requests.get(url, headers=headers, params=params)
        return response.json()
        
    def get_kundli(self, lat: float, lon: float, date_iso: str):
        token = self.get_token()
        if not token:
            return {"error": "Authentication failed"}
            
        url = "https://api.prokerala.com/v2/astrology/kundli"
        headers = {"Authorization": f"Bearer {token}"}
        params = {
            "ayanamsa": 1, 
            "coordinates": f"{lat},{lon}",
            "datetime": date_iso
        }
        response = requests.get(url, headers=headers, params=params)
        return response.json()
