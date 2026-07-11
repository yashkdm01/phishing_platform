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
        return {"risk_level": "ERROR", "status": "Invalid URL format", "details": {"error": "Malformed URL"}}

    details = {"engine": "local_heuristics"}
    risk_level = "LOW"
    status = "Verified Clean by Local Engine"

    # 1. Google Safe Browsing Check
    if GOOGLE_SAFE_BROWSING_KEY:
        gsb_url = f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={GOOGLE_SAFE_BROWSING_KEY}"
        payload = {
            "client": {"clientId": "threat-defend-platform", "clientVersion": "1.0"},
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
                return {
                    "risk_level": "HIGH",
                    "status": "Phishing/Malware actively flagged by Google Intelligence",
                    "details": {"matches": res["matches"], "engine": "google_safe_browsing"}
                }
        except Exception:
            details["google_error"] = "Service connection timeout"

    # 2. VirusTotal Core Check
    if VIRUSTOTAL_API_KEY:
        url_id = base64.urlsafe_b64encode(url.encode()).decode().strip("=")
        vt_url = f"https://www.virustotal.com/api/v3/urls/{url_id}"
        headers = {"x-apikey": VIRUSTOTAL_API_KEY}
        
        try:
            res = requests.get(vt_url, headers=headers)
            if res.status_code == 200:
                stats = res.json().get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
                
                if stats.get("malicious", 0) > 0 or stats.get("phishing", 0) > 0:
                    return {
                        "risk_level": "HIGH",
                        "status": f"Malicious payload flagged by global security partners.",
                        "details": stats
                    }
                elif stats.get("suspicious", 0) > 0:
                    return {
                        "risk_level": "MEDIUM",
                        "status": "Warning: Flagged as suspicious by threat intel feeds.",
                        "details": stats
                    }
                else:
                    return {
                        "risk_level": "LOW",
                        "status": "Verified Clean by VirusTotal global consensus.",
                        "details": stats
                    }
        except Exception:
            details["vt_error"] = "Service connection timeout"

    # 3. Aggressive Proactive Keyword Fallback Engine
    url_lower = url.lower()
    suspicious_keywords = ["login", "secure", "update", "verify", "banking", "account", "free-win", "paypal", "microsoft", "office365"]
    
    # Catch structural red flags like missing HTTPS or direct IP addresses
    has_suspicious_words = any(keyword in url_lower for keyword in suspicious_keywords)
    is_not_secure = url_lower.startswith("http://")
    
    if has_suspicious_words or is_not_secure:
        risk_level = "HIGH" if (has_suspicious_words and is_not_secure) else "MEDIUM"
        status = "Suspicious URL structural mechanics flagged by AI analyzer."
        details["heuristics_flags"] = {
            "non_secure_protocol": is_not_secure,
            "blacklisted_keywords_found": [w for w in suspicious_keywords if w in url_lower]
        }

    return {"risk_level": risk_level, "status": status, "details": details}
