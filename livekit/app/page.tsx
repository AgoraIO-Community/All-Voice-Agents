"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import { AgentConfig, defaultAgentConfig, flattenImportantConfig, VendorDefinition } from "@/lib/agent-config";

type CatalogResponse = { vendors: VendorDefinition[]; credentialProfiles: Array<{ id: string; vendorId: string; label: string; envKey: string }> };
type SessionResponse = {
  session: { id: string; roomName: string; activeConfig: AgentConfig; createdAt: string };
  livekit: { ok: true; serverUrl: string; token: string; roomName: string; identity: string } | { ok: false; missing: string[] };
  demoMode: boolean;
};
type TranscriptTurn = { id: string; role: "user" | "agent"; text: string; at: string; final: boolean };

function apiUrl(path: `/api/${string}`) {
  return path;
}

function formatTurnTime(at: string) {
  return new Date(at).toLocaleTimeString();
}

export default function Home() {
  const [draftConfig, setDraftConfig] = useState<AgentConfig>(defaultAgentConfig);
  const [activeConfig, setActiveConfig] = useState<AgentConfig | null>(null);
  const [catalog, setCatalog] = useState<CatalogResponse>({ vendors: [], credentialProfiles: [] });
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [status, setStatus] = useState("Draft config ready");
  const [saving, setSaving] = useState(false);
  const [listening, setListening] = useState(false);
  const [starting, setStarting] = useState(false);
  const [agentConnected, setAgentConnected] = useState(false);
  const roomRef = useRef<Room | null>(null);
  const remoteAudioRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void fetch(apiUrl("/api/catalog"))
      .then((response) => response.json())
      .then((data: CatalogResponse) => setCatalog(data))
      .catch(() => setStatus("Could not load vendor catalog"));

    void fetch(apiUrl("/api/configs"))
      .then((response) => response.json())
      .then((data: { configs: AgentConfig[] }) => {
        const config = data.configs.find((item) => item.id === "default") ?? data.configs[0];
        if (config) setDraftConfig(config);
      })
      .catch(() => setStatus("Could not load default agent config"));
  }, []);

  const vendorsByCapability = useMemo(() => ({
    asr: catalog.vendors.filter((vendor) => vendor.enabled && vendor.capability === "asr"),
    llm: catalog.vendors.filter((vendor) => vendor.enabled && vendor.capability === "llm"),
    tts: catalog.vendors.filter((vendor) => vendor.enabled && vendor.capability === "tts"),
  }), [catalog.vendors]);

  const importantConfig = useMemo(() => flattenImportantConfig(activeConfig ?? draftConfig), [activeConfig, draftConfig]);

  function updateConfig(mutator: (config: AgentConfig) => AgentConfig) {
    setDraftConfig((current) => mutator(structuredClone(current)));
  }

  function updateProvider(capability: "asr" | "llm" | "tts", vendorId: string) {
    const vendor = catalog.vendors.find((item) => item.vendorId === vendorId && item.capability === capability);
    if (!vendor) return;
    updateConfig((config) => {
      const credentialProfileId = vendor.defaultCredentialMode === "custom_key" ? catalog.credentialProfiles.find((profile) => profile.vendorId === vendorId)?.id : undefined;
      if (capability === "asr") {
        config.providers.asr = { ...config.providers.asr, vendorId, model: vendor.models[0], credentialMode: vendor.defaultCredentialMode, credentialProfileId };
      }
      if (capability === "llm") {
        config.providers.llm = { ...config.providers.llm, vendorId, model: vendor.models[0], credentialMode: vendor.defaultCredentialMode, credentialProfileId };
      }
      if (capability === "tts") {
        config.providers.tts = { ...config.providers.tts, vendorId, model: vendor.models[0], credentialMode: vendor.defaultCredentialMode, credentialProfileId };
      }
      return config;
    });
  }

  async function saveConfig() {
    setSaving(true);
    const response = await fetch(apiUrl("/api/configs"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draftConfig),
    });
    const payload = await response.json();
    setSaving(false);
    if (!response.ok) {
      setStatus(`Config invalid: ${payload.issues?.join("; ") ?? "unknown error"}`);
      return false;
    }
    setStatus("Config saved. Provider/model changes apply to the next conversation.");
    return true;
  }

  async function startSession() {
    if (starting) return;
    setStarting(true);
    const saved = await saveConfig();
    if (!saved) {
      setStarting(false);
      return;
    }
    const response = await fetch(apiUrl("/api/sessions"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ configId: draftConfig.id }),
    });
    const payload: SessionResponse = await response.json();
    setSession(payload);
    setActiveConfig(payload.session.activeConfig);
    const livekitState = payload.livekit.ok ? `LiveKit room ready: ${payload.session.roomName}` : `Demo mode: missing ${payload.livekit.missing.join(", ")}`;
    setStatus(livekitState);
    setTranscript([]);

    if (!payload.livekit.ok) {
      setStarting(false);
      return;
    }

    try {
      await connectRoom(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown LiveKit connection error";
      setStatus(`Could not connect to LiveKit: ${message}`);
    } finally {
      setStarting(false);
    }
  }

  async function connectRoom(payload: SessionResponse) {
    if (!payload.livekit.ok) return;
    await roomRef.current?.disconnect();
    remoteAudioRef.current?.replaceChildren();

    const room = new Room({ adaptiveStream: true, dynacast: true });
    roomRef.current = room;

    room.on(RoomEvent.ConnectionStateChanged, (state) => setStatus(`LiveKit connection: ${state}`));
    room.on(RoomEvent.ParticipantConnected, (participant) => {
      setAgentConnected(true);
      setStatus(`${participant.identity} joined. Mic is live; speak naturally.`);
    });
    room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      setStatus(`${participant.identity} left the room.`);
    });
    room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
      if (track.kind !== Track.Kind.Audio) return;
      const element = track.attach();
      element.autoplay = true;
      element.dataset.participant = participant.identity;
      remoteAudioRef.current?.appendChild(element);
      setAgentConnected(true);
      setStatus(`Receiving agent audio from ${participant.identity}. Keep talking naturally.`);
    });
    room.on(RoomEvent.TrackUnsubscribed, (track) => {
      track.detach().forEach((element) => element.remove());
    });
    room.on(RoomEvent.TranscriptionReceived, (segments, participant) => {
      for (const segment of segments) {
        if (!segment.text.trim()) continue;
        const role: TranscriptTurn["role"] = participant?.identity.startsWith("agent-") ? "agent" : "user";
        setTranscript((current) => {
          const existing = current.findIndex((turn) => turn.id === segment.id);
          const nextTurn: TranscriptTurn = {
            id: segment.id,
            role,
            text: segment.text,
            at: new Date(Date.now()).toISOString(),
            final: segment.final,
          };
          if (existing === -1) return [...current, nextTurn];
          return current.map((turn, index) => (index === existing ? nextTurn : turn));
        });
      }
    });
    room.on(RoomEvent.Disconnected, () => {
      setListening(false);
      setAgentConnected(false);
      setStatus("Disconnected from LiveKit");
    });

    await room.connect(payload.livekit.serverUrl, payload.livekit.token);
    await room.localParticipant.setMicrophoneEnabled(true);
    setListening(true);
    setStatus(`Connected to ${payload.livekit.roomName}. Mic is live. Start speaking.`);
  }

  function stopSession() {
    setListening(false);
    void roomRef.current?.disconnect();
    roomRef.current = null;
    remoteAudioRef.current?.replaceChildren();
    setAgentConnected(false);
    setSession(null);
    setActiveConfig(null);
    setStatus("Session stopped. Draft edits are ready for the next conversation.");
  }

  function addDemoVendor() {
    const vendor: VendorDefinition = {
      vendorId: `custom-llm-${Date.now()}`,
      label: "Custom OpenAI-compatible LLM",
      capability: "llm",
      credentialModes: ["custom_key"],
      defaultCredentialMode: "custom_key",
      models: ["custom-chat-model"],
      configFields: ["model", "temperature", "baseUrl"],
      enabled: true,
    };
    void fetch(apiUrl("/api/catalog/vendors"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vendor),
    }).then((response) => response.json()).then((data) => {
      setCatalog((current) => ({ ...current, vendors: data.vendors }));
      setStatus("Added a demo custom LLM vendor to the catalog.");
    });
  }

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <div className="eyebrow">LiveKit AI Voice Agent Console</div>
          <h1 className="title">Configure vendors. Start your agent. Talk naturally.</h1>
          <p className="subtitle">Edit agent values, select ASR/LLM/TTS vendors per session, then press Start Agent to join a LiveKit room, publish your microphone, and hear the agent respond.</p>
        </div>
        <div className="actions">
          <button className="btn primary" onClick={startSession} disabled={starting || Boolean(session)}>{starting ? "Starting..." : session ? "Agent Started" : "Start Agent"}</button>
          <span className={`badge ${session ? "good" : "warn"}`}><span className="status-dot" />{session ? "room active" : "not connected"}</span>
          <span className={`badge ${agentConnected ? "good" : ""}`}>{agentConnected ? "agent audio ready" : "waiting for agent"}</span>
          <span className="badge">switching: next_session</span>
        </div>
      </section>

      <section className="grid layout">
        <div className="grid">
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Editable Agent Configuration</h2>
                <p className="panel-desc">Draft edits save anytime. Provider/model changes apply before starting the next conversation.</p>
              </div>
              <span className="badge">draftConfig</span>
            </div>
            <div className="form">
              <label className="field"><span className="label">name</span><input className="input" value={draftConfig.name} onChange={(event) => updateConfig((config) => ({ ...config, name: event.target.value }))} /></label>
              <ProviderSelect label="providers.asr.vendorId" vendors={vendorsByCapability.asr} value={draftConfig.providers.asr.vendorId} onChange={(value) => updateProvider("asr", value)} />
              <ProviderSelect label="providers.llm.vendorId" vendors={vendorsByCapability.llm} value={draftConfig.providers.llm.vendorId} onChange={(value) => updateProvider("llm", value)} />
              <ProviderSelect label="providers.tts.vendorId" vendors={vendorsByCapability.tts} value={draftConfig.providers.tts.vendorId} onChange={(value) => updateProvider("tts", value)} />
              <div className="field-row">
                <label className="field"><span className="label">providers.asr.model</span><input className="input" value={draftConfig.providers.asr.model} onChange={(event) => updateConfig((config) => { config.providers.asr.model = event.target.value; return config; })} /></label>
                <label className="field"><span className="label">providers.asr.language</span><input className="input" value={draftConfig.providers.asr.language} onChange={(event) => updateConfig((config) => { config.providers.asr.language = event.target.value; return config; })} /></label>
              </div>
              <div className="field-row">
                <label className="field"><span className="label">providers.llm.model</span><input className="input" value={draftConfig.providers.llm.model} onChange={(event) => updateConfig((config) => { config.providers.llm.model = event.target.value; return config; })} /></label>
                <label className="field"><span className="label">providers.llm.temperature</span><input className="input" type="number" min="0" max="2" step="0.1" value={draftConfig.providers.llm.temperature} onChange={(event) => updateConfig((config) => { config.providers.llm.temperature = Number(event.target.value); return config; })} /></label>
              </div>
              <div className="field-row">
                <label className="field"><span className="label">providers.tts.model</span><input className="input" value={draftConfig.providers.tts.model} onChange={(event) => updateConfig((config) => { config.providers.tts.model = event.target.value; return config; })} /></label>
                <label className="field"><span className="label">providers.tts.voice</span><input className="input" value={draftConfig.providers.tts.voice} onChange={(event) => updateConfig((config) => { config.providers.tts.voice = event.target.value; return config; })} /></label>
              </div>
              <label className="field"><span className="label">system prompt</span><textarea className="textarea" aria-label="system prompt" value={draftConfig.instructions} onChange={(event) => updateConfig((config) => ({ ...config, instructions: event.target.value }))} /></label>
              <div className="actions"><button className="btn" onClick={saveConfig} disabled={saving}>{saving ? "Saving..." : "Save Config"}</button></div>
            </div>
          </section>
        </div>

        <div className="grid">
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Conversation + Live Transcript</h2>
                <p className="panel-desc">Click Start Agent once, allow microphone access, then just speak. Your mic stays live until you end the conversation.</p>
              </div>
              <span className={`badge ${listening ? "good" : ""}`}>{listening ? "listening" : "talk mode"}</span>
            </div>
            <div className="transcript">
              {transcript.length === 0 ? <div className="empty-transcript">Transcript will appear here when you and the agent speak.</div> : null}
              {transcript.map((turn) => <div className={`bubble ${turn.role === "agent" ? "agent" : "user"} ${turn.final ? "" : "interim"}`} key={turn.id}><span className="bubble-meta">{turn.role} · {formatTurnTime(turn.at)}{turn.final ? "" : " · listening"}</span>{turn.text}</div>)}
            </div>
            <div ref={remoteAudioRef} aria-label="Remote agent audio" />
            <div className="talkbar single-action">
              {!session ? <button className="btn primary" onClick={startSession} disabled={starting}>{starting ? "Starting Agent..." : "Start Agent"}</button> : <button className="btn danger" onClick={stopSession}>End Conversation</button>}
            </div>
          </section>
          <section className="panel pad">
            <h2 className="panel-title">Runtime Status</h2>
            <p className="panel-desc">{status}</p>
            {session?.livekit.ok ? <pre className="code">{JSON.stringify({ roomName: session.livekit.roomName, identity: session.livekit.identity, connected: listening, agentAudio: agentConnected }, null, 2)}</pre> : <p className="panel-desc">Set `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` to receive a real join token.</p>}
            {session ? <div className="actions" style={{ marginTop: 14 }}><button className="btn danger" onClick={stopSession}>End Conversation</button></div> : null}
          </section>
        </div>

        <div className="grid right-col">
          <section className="panel">
            <div className="panel-header"><div><h2 className="panel-title">Active Config Keys</h2><p className="panel-desc">Exact object keys currently active in the session, or draft keys before start.</p></div><span className="badge">{activeConfig ? "activeConfig" : "draftConfig"}</span></div>
            <div className="kv">{importantConfig.map((item) => <div className="kv-row" key={item.key}><span className="kv-key">{item.key}</span><span className="kv-value">{String(item.value)}</span></div>)}</div>
          </section>
          <section className="panel">
            <div className="panel-header"><div><h2 className="panel-title">Vendor Catalog</h2><p className="panel-desc">Add more providers without changing the session/config architecture.</p></div><button className="btn" onClick={addDemoVendor}>Add Demo Vendor</button></div>
            <div className="catalog">{catalog.vendors.map((vendor) => <div className="vendor" key={vendor.vendorId}><div className="vendor-top"><div><div className="vendor-name">{vendor.label}</div><div className="vendor-meta">{vendor.vendorId} · {vendor.capability}</div></div><span className="badge">{vendor.defaultCredentialMode}</span></div><div className="vendor-meta">models: {vendor.models.join(", ")}</div></div>)}</div>
          </section>
        </div>
      </section>
    </main>
  );
}

function ProviderSelect({ label, vendors, value, onChange }: { label: string; vendors: VendorDefinition[]; value: string; onChange: (value: string) => void }) {
  return <label className="field"><span className="label">{label}</span><select className="select" value={value} onChange={(event) => onChange(event.target.value)}>{vendors.map((vendor) => <option key={vendor.vendorId} value={vendor.vendorId}>{vendor.label}</option>)}</select></label>;
}
