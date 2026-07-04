def analyze_email(content: str) -> dict:
    """
    Scans email body text for common phishing and social engineering tactics.
    Categorizes findings into scam keywords, threats, and fake logins.
    """
    content_lower = content.lower()
    
    # Threat databases based on industry standard phishing patterns
    scam_keywords = ["lottery", "winner", "gift card", "wire transfer", "investment", "urgent", "act now"]
    threatening_language = ["account suspended", "legal action", "immediate action required", "penalty", "locked out"]
    fake_logins = ["verify your account", "click here to login", "update your billing", "confirm your identity"]
    
    found_scams = [word for word in scam_keywords if word in content_lower]
    found_threats = [phrase for phrase in threatening_language if phrase in content_lower]
    found_logins = [phrase for phrase in fake_logins if phrase in content_lower]
    
    # Calculate a basic risk score
    risk_score = len(found_scams) + len(found_threats) + len(found_logins)
    
    details = {
        "scam_keywords_found": found_scams,
        "threatening_language_found": found_threats,
        "fake_login_requests_found": found_logins
    }
    
    # Classify the final threat level
    if risk_score >= 3 or len(found_threats) > 0 or len(found_logins) > 0:
        return {
            "risk_level": "HIGH",
            "status": "Warning: Possible Phishing Attempt",
            "details": details
        }
    elif risk_score > 0:
        return {
            "risk_level": "MEDIUM",
            "status": "Suspicious Content Detected",
            "details": details
        }
    else:
        return {
            "risk_level": "LOW",
            "status": "Safe",
            "details": details
        }