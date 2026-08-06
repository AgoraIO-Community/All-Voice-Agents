# LiveKit Python Agent Worker

This worker follows the current LiveKit Python voice AI quickstart shape verified from `https://docs.livekit.io/agents/start/voice-ai/`.

Run locally after setting LiveKit credentials in the project root `.env.local`:

```bash
cd worker
uv sync --extra test
uv run pytest
uv run agent.py dev
```

The web app creates a session `activeConfig` snapshot. The production next step is to pass that snapshot as dispatch metadata or fetch it from the app API by session ID before constructing the `AgentSession`.
