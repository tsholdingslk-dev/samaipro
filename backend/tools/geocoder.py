import urllib.parse
import requests

def get_lat_lon(city_name):
    try:
        url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(city_name)}&format=json&limit=1"
        res = requests.get(url, headers={'User-Agent': 'SamAI/1.0'}).json()
        if res:
            return float(res[0]['lat']), float(res[0]['lon'])
    except:
        pass
    return 6.9271, 79.8612 # Default Colombo
