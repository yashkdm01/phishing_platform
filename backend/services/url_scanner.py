import os
import requests
import base64
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()

VIRUSTOTAL_API_KEY = os.getenv("VIRUSTOTAL_API_KEY")
GOOGLE_SAFE_BROWSING_KEY = os.getenv("GOOGLE_SAFE_BROWSING_KEY")

def is_valid_url(url: str) -> bool:
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except ValueError:
        return False

def analyze_url(url: str) -> dict:
    if not is_valid_url(url):
        return {"risk_level": "ERROR", "status": "Invalid URL format", "details": {}}

    details = {}
    risk_level = "LOW"
    status = "Safe"

    # 1. Google Safe Browsing API Integration
    if GOOGLE_SAFE_BROWSING_KEY:
        gsb_url = f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={GOOGLE_SAFE_BROWSING_KEY}"
        payload = {
            "client": {"clientId": "ai-phishing-platform", "clientVersion": "1.0"},
            "threatInfo": {
                "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
                "platformTypes": ["ANY_PLATFORM"],
                "threatEntryTypes": ["URL"],
                "threatEntries": [{"url": url}]
            }
        }
        try:
            res = requests.post(gsb_url, json=payload).json()
            if "matches" in res:
                risk_level = "HIGH"
                status = "Phishing/Malware Detected by Google"
                details["google_safe_browsing"] = res["matches"]
        except Exception as e:
            details["google_error"] = "Failed to connect to Google API"

    # 2. VirusTotal API Integration (v3)
    if VIRUSTOTAL_API_KEY and risk_level == "LOW":
        # VirusTotal requires URL-safe base64 encoding for URLs
        url_id = base64.urlsafe_b64encode(url.encode()).decode().strip("=")
        vt_url = f"https://www.virustotal.com/api/v3/urls/{url_id}"
        headers = {"x-apikey": VIRUSTOTAL_API_KEY}
        
        try:
            res = requests.get(vt_url, headers=headers)
            if res.status_code == 200:
                stats = res.json().get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
                details["virustotal"] = stats
                
                # If 1 or more security vendors flag it, mark as high risk
                if stats.get("malicious", 0) > 0 or stats.get("phishing", 0) > 0:
                    risk_level = "HIGH"
                    status = "Phishing Detected by VirusTotal"
        except Exception as e:
            details["vt_error"] = "Failed to connect to VirusTotal API"

    # 3. Rule-Based Fallback (If API keys are missing in .env)
    if not VIRUSTOTAL_API_KEY and not GOOGLE_SAFE_BROWSING_KEY:
        suspicious_keywords = ["login", "secure", "update", "verify", "banking", "account", "free-win"]
        if any(keyword in url.lower() for keyword in suspicious_keywords):
            return {
                "risk_level": "HIGH",
                "status": "Phishing Website",
                "details": {"source": "Rule-Based Algorithm (Keywords Detected)"}
            }

    return {"risk_level": risk_level, "status": status, "details": details}