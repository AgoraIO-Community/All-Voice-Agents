from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal


CredentialMode = Literal["livekit_inference", "custom_key"]
Capability = Literal["asr", "llm", "tts"]


@dataclass(frozen=True)
class ProviderSelection:
    vendor_id: str
    model: str
    credential_mode: CredentialMode
    credential_profile_id: str | None = None
    language: str | None = None
    temperature: float | None = None
    voice: str | None = None
    speed: float | None = None


@dataclass(frozen=True)
class WorkerAgentConfig:
    name: str
    instructions: str
    asr: ProviderSelection
    llm: ProviderSelection
    tts: ProviderSelection
    noise_cancellation_enabled: bool
    barge_in_enabled: bool
    turn_detection_enabled: bool
    turn_detection_timeout_ms: int


def _provider(data: dict[str, Any], capability: Capability) -> ProviderSelection:
    selected = data["providers"][capability]
    if selected["credentialMode"] == "custom_key" and not selected.get("credentialProfileId"):
        raise ValueError(f"providers.{capability}.credentialProfileId is required for custom_key mode")
    return ProviderSelection(
        vendor_id=selected["vendorId"],
        model=selected["model"],
        credential_mode=selected["credentialMode"],
        credential_profile_id=selected.get("credentialProfileId"),
        language=selected.get("language"),
        temperature=selected.get("temperature"),
        voice=selected.get("voice"),
        speed=selected.get("speed"),
    )


def load_worker_config(data: dict[str, Any]) -> WorkerAgentConfig:
    if data["session"]["mode"] != "talk":
        raise ValueError("Only session.mode=talk is supported")
    if data["session"]["applyConfigChanges"] != "next_session":
        raise ValueError("Provider changes must apply on next_session")
    return WorkerAgentConfig(
        name=data["name"],
        instructions=data["instructions"],
        asr=_provider(data, "asr"),
        llm=_provider(data, "llm"),
        tts=_provider(data, "tts"),
        noise_cancellation_enabled=data["audio"]["noiseCancellationEnabled"],
        barge_in_enabled=data["audio"]["bargeInEnabled"],
        turn_detection_enabled=data["turnDetection"]["enabled"],
        turn_detection_timeout_ms=data["turnDetection"]["timeoutMs"],
    )
