import pytest
import asyncio
from intent.router import IntentRouter

@pytest.mark.asyncio
async def test_local_rule_matching():
    """Test that local rules match common commands without hitting the LLM."""
    router = IntentRouter()

    # Test time/clock matching
    res = router._match_local_rules("what time is it")
    assert res is not None
    assert res["intent"] == "get_time_date"

    # Test battery matching
    res2 = router._match_local_rules("how much battery do I have")
    assert res2 is not None
    assert res2["intent"] == "read_battery"

    # Test volume matching with number capture
    res3 = router._match_local_rules("set volume to 80")
    assert res3 is not None
    assert res3["intent"] == "system_control"
    assert res3["tasks"][0]["parameters"]["level"] == 80

    # Test open app matching
    res4 = router._match_local_rules("open chrome")
    assert res4 is not None
    assert res4["intent"] == "open_app"
    assert res4["tasks"][0]["parameters"]["app_name"] == "chrome"

    # Test unmatched (should go to LLM)
    res_miss = router._match_local_rules("how tall is mount everest")
    assert res_miss is None

@pytest.mark.asyncio
async def test_local_rule_shutdown():
    """Test system control local rules."""
    router = IntentRouter()

    res = router._match_local_rules("shutdown the computer")
    assert res is not None
    assert res["intent"] == "system_control"
    assert res["tasks"][0]["parameters"]["action"] == "shutdown"

    res2 = router._match_local_rules("lock the workstation")
    assert res2 is not None
    assert res2["intent"] == "system_control"
    assert res2["tasks"][0]["parameters"]["action"] == "lock"
