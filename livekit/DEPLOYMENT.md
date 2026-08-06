# Deployment

## Architecture

The Next.js app does not call the Python worker over HTTP.

Instead, both sides connect to the same LiveKit Cloud project:

```text
Browser <-> LiveKit Cloud Room <-> Python LiveKit Agent Worker
```

The Next.js API creates a LiveKit room token with an agent dispatch request for:

```text
configurable-voice-agent
```

The Python worker registers itself with LiveKit Cloud using the same `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET`. When a user starts a room, LiveKit Cloud dispatches the job to the registered worker.

## Vercel Environment Variables

Set these in the Vercel project that hosts the Next.js app:

```bash
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
```

These let the Next.js API generate participant tokens and request agent dispatch.

## Python Worker Environment Variables

Set the same LiveKit variables wherever the Python worker runs:

```bash
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
```

Optional direct vendor keys can also be set on the worker host:

```bash
OPENAI_API_KEY=
DEEPGRAM_API_KEY=
ELEVENLABS_API_KEY=
CARTESIA_API_KEY=
```

## Running The Worker

For local development:

```bash
cd worker
uv run python agent.py dev
```

For production, run the worker as a long-running service on a VM, container, or process host. The key requirement is that it stays online and registered with LiveKit Cloud.

## Do You Need A Python Server URL?

No, not for this architecture.

There is no `PYTHON_SERVER_URL` because Next.js does not need to call Python directly. LiveKit Cloud is the coordination layer.

You would only add a Python server URL if you intentionally changed the architecture to expose your own Python HTTP API, for example:

```text
Next.js API -> Python HTTP API -> starts/stops worker jobs
```

That is not necessary for the current LiveKit Agents dispatch model.
