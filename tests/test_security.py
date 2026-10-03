import pytest
from security.policy import SecurityPolicy

def test_security_safe_action():
    sec = SecurityPolicy(db_path=":memory:") # Use RAM DB
    
    intent = {
        "intent": "system_volume_set",
        "risk_level": "safe",
        "source": "local_rule"
    }
    
    assert sec.validate(intent) == True

def test_security_dangerous_llm_rejection():
    sec = SecurityPolicy(db_path=":memory:")
    
    intent = {
        "intent": "system_shutdown",
        "risk_level": "dangerous",
        "source": "cloud_llm"
    }
    
    # LLM cannot trigger DANGEROUS macros
    assert sec.validate(intent) == False
    
def test_security_dangerous_local_approval():
    sec = SecurityPolicy(db_path=":memory:")
    
    intent = {
        "intent": "system_shutdown",
        "risk_level": "dangerous",
        "source": "local_rule"
    }
    
    # Local Engine triggers are allowed via Fast Path
    assert sec.validate(intent) == True
