import pytest

from config import load_worker_config
from agent import DEFAULT_INSTRUCTIONS, instructions_from_metadata


def base_config():
    return {
        "name": "Support Voice Agent",
        "instructions": "Be concise.",
        "session": {"mode": "talk", "applyConfigChanges": "next_session"},
        "providers": {
            "asr": {"vendorId": "livekit-inference-asr", "model": "deepgram/nova-3", "credentialMode": "livekit_inference", "language": "en"},
            "llm": {"vendorId": "livekit-inference-llm", "model": "openai/gpt-4.1-mini", "credentialMode": "livekit_inference", "temperature": 0.4},
            "tts": {"vendorId": "livekit-inference-tts", "model": "inworld/inworld-tts-2", "credentialMode": "livekit_inference", "voice": "Ashley", "speed": 1},
        },
        "audio": {"bargeInEnabled": True, "noiseCancellationEnabled": True},
        "turnDetection": {"enabled": True, "timeoutMs": 900},
    }


def test_loads_worker_config():
    loaded = load_worker_config(base_config())

    assert loaded.name == "Support Voice Agent"
    assert loaded.asr.vendor_id == "livekit-inference-asr"
    assert loaded.llm.temperature == 0.4
    assert loaded.tts.voice == "Ashley"
    assert loaded.turn_detection_timeout_ms == 900


def test_rejects_live_provider_switching():
    config = base_config()
    config["session"]["applyConfigChanges"] = "immediate"

    with pytest.raises(ValueError, match="next_session"):
        load_worker_config(config)


def test_custom_key_requires_profile():
    config = base_config()
    config["providers"]["llm"] = {"vendorId": "openai", "model": "gpt-5.3-chat-latest", "credentialMode": "custom_key", "temperature": 0.3}

    with pytest.raises(ValueError, match="credentialProfileId"):
        load_worker_config(config)


def test_loads_instructions_from_dispatch_metadata():
    instructions = "You are a strict one sentence assistant."
    metadata = {"activeConfig": {"instructions": instructions}}

    assert instructions_from_metadata(__import__("json").dumps(metadata)) == instructions


def test_falls_back_to_default_instructions_for_bad_metadata():
    assert instructions_from_metadata("not-json") == DEFAULT_INSTRUCTIONS
