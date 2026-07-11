def analyze_email(content: str) -> dict:
    """
    Scans email body text using a multi-layered keyword metric engine.
    Detects brand impersonation, urgency triggers, and call-to-actions dynamically.
    """
    content_lower = content.lower()
    
    # High-risk security indicators
    indicators = {
        "urgency": ["urgent", "action required", "immediate", "expires", "24 hours", "12 hours", "deactivated", "suspended", "overdue"],
        "financial": ["wire transfer", "invoice", "payment details", "customs fee", "billing", "gift card", "lottery"],
        "brand_impersonation": ["office365", "microsoft", "paypal", "meta", "facebook", "docusign", "fedex", "appleid"],
        "credential_hooks": ["log in", "verify your", "confirm your", "click here", "secure link", "reset your password"]
    }
    
    found_urgency = [w for w in indicators["urgency"] if w in content_lower]
    found_financial = [w for w in indicators["financial"] if w in content_lower]
    found_brands = [w for w in indicators["brand_impersonation"] if w in content_lower]
    found_hooks = [w for w in indicators["credential_hooks"] if w in content_lower]
    
    # Calculate a weighted vulnerability risk assessment
    risk_score = (len(found_urgency) * 1.5) + (len(found_financial) * 1.5) + (len(found_brands) * 2.0) + (len(found_hooks) * 2.0)
    
    details = {
        "urgency_triggers": found_urgency,
        "financial_keywords": found_financial,
        "targeted_brands": found_brands,
        "credential_hooks": found_hooks
    }
    
    # Dynamic classification logic
    if risk_score >= 3.5:
        return {
            "risk_level": "HIGH",
            "status": "Warning: High Probability Phishing Campaign Detected",
            "details": details
        }
    elif risk_score > 0:
        return {
            "risk_level": "MEDIUM",
            "status": "Suspicious Social Engineering Patterns Identified",
            "details": details
        }
    else:
        return {
            "risk_level": "LOW",
            "status": "Safe: Standard Communication Signature",
            "details": details
        }
