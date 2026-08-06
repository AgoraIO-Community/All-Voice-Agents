from __future__ import annotations

import json

from dotenv import load_dotenv

from livekit import agents
from livekit.agents import Agent, AgentServer, AgentSession, TurnHandlingOptions, inference, room_io
from livekit.plugins import ai_coustics

load_dotenv("../.env.local")
load_dotenv(".env.local", override=True)


DEFAULT_INSTRUCTIONS = """
You are a concise, friendly voice AI assistant. Keep answers brief, natural, and easy to follow by ear.
"""


class ConfigurableAssistant(Agent):
    def __init__(self, instructions: str = DEFAULT_INSTRUCTIONS) -> None:
        super().__init__(instructions=instructions)


def instructions_from_metadata(metadata: str) -> str:
    if not metadata:
        return DEFAULT_INSTRUCTIONS
    try:
        payload = json.loads(metadata)
    except json.JSONDecodeError:
        return DEFAULT_INSTRUCTIONS

    active_config = payload.get("activeConfig") if isinstance(payload, dict) else None
    instructions = active_config.get("instructions") if isinstance(active_config, dict) else None
    return instructions if isinstance(instructions, str) and instructions.strip() else DEFAULT_INSTRUCTIONS


server = AgentServer()


@server.rtc_session(agent_name="configurable-voice-agent")
async def configurable_voice_agent(ctx: agents.JobContext):
    # LiveKit docs verified 2026-08-06: LiveKit Inference models can be passed
    # through inference.STT/LLM/TTS in AgentSession. Direct custom-key vendor
    # adapters should be added behind this construction boundary.
    instructions = instructions_from_metadata(ctx.job.metadata)

    session = AgentSession(
        stt=inference.STT(model="deepgram/nova-3", language="multi"),
        llm=inference.LLM(model="openai/gpt-4.1-mini"),
        tts=inference.TTS(model="inworld/inworld-tts-2", voice="Ashley"),
        turn_handling=TurnHandlingOptions(turn_detection=inference.TurnDetector()),
    )

    await session.start(
        room=ctx.room,
        agent=ConfigurableAssistant(instructions=instructions),
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=ai_coustics.audio_enhancement(
                    model=ai_coustics.EnhancerModel.QUAIL_VF_S,
                ),
            ),
        ),
    )

    await session.generate_reply(instructions="Greet the user and offer your assistance.")


if __name__ == "__main__":
    agents.cli.run_app(server)
