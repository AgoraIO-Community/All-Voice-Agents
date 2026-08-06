import {
  ConversationProvider,
  useConversation,
  useConversationClientTool,
} from "@elevenlabs/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createVoiceSession } from "./api";
import conciergeImage from "./assets/monody-le--ir029FaQwI-unsplash.jpg";
import heroImage from "./assets/kiril-dobrev-v63UL8s28Ew-unsplash.jpg";
import {
  getElevenLabsPath,
  getElevenLabsRoute,
  type ElevenLabsRouteId,
} from "./elevenLabsRoute";
import "./ElevenLabsExperience.css";

type AgentId = "maya" | "aarav";
type RouteId = ElevenLabsRouteId;
type DemoEngineId = "elevenlabs" | "agora";

type PageConfig = {
  agentId: AgentId;
  agentName: string;
  ariaLabel: string;
  ctaLabel: string;
  description: string;
  titleOutline: string;
  titleSolid: string;
};

type TravelDetailsFormParams = {
  caller_name?: string;
  recipient_email?: string;
  recipient_phone?: string;
  request_type?: string;
  trip_summary?: string;
};

type TravelClientTools = {
  send_travel_details_form: (params: TravelDetailsFormParams) => string;
};

const waveformBars = Array.from({ length: 17 }, (_, index) => index);
const routeImages: Record<RouteId, string> = {
  concierge: conciergeImage,
  explore: heroImage,
};
const agentNames: Record<AgentId, string> = {
  aarav: "Aarav",
  maya: "Maya",
};

function getDefaultAgentForRoute(routeId: RouteId): AgentId {
  return routeId === "concierge" ? "aarav" : "maya";
}

function phoneIcon(className = "call-icon") {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M13 2a9 9 0 0 1 9 9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M13 6a5 5 0 0 1 5 5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function micIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path d="M12 19v3" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <rect x="9" y="2" width="6" height="13" rx="3" />
    </svg>
  );
}

function micOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path d="M12 19v3" />
      <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
      <path d="M16.95 16.95A7 7 0 0 1 5 12v-2" />
      <path d="M18.89 13.23A7 7 0 0 0 19 12v-2" />
      <path d="m2 2 20 20" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
    </svg>
  );
}

function speakerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
      <path d="M16 9a5 5 0 0 1 0 6" />
      <path d="M19.364 18.364a9 9 0 0 0 0-12.728" />
    </svg>
  );
}

function speakerOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path d="M16 9a5 5 0 0 1 .95 2.293" />
      <path d="M19.364 5.636a9 9 0 0 1 1.889 9.96" />
      <path d="m2 2 20 20" />
      <path d="m7 7-.587.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298V11" />
      <path d="M9.828 4.172A.686.686 0 0 1 11 4.657v.686" />
    </svg>
  );
}

function phoneOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path d="M10.1 13.9a14 14 0 0 0 3.732 2.668 1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2 18 18 0 0 1-12.728-5.272" />
      <path d="M22 2 2 22" />
      <path d="M4.76 13.582A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 .244.473" />
    </svg>
  );
}

function houseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

function formatCallDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

interface ElevenLabsExperienceProps {
  pathname: string;
  onNavigate: (path: string) => void;
}

type VoiceExperienceProps = ElevenLabsExperienceProps;

export const ElevenLabsExperience: React.FC<ElevenLabsExperienceProps> = ({
  pathname,
  onNavigate,
}: ElevenLabsExperienceProps) => {
  return (
    <ConversationProvider>
      <VoiceExperience pathname={pathname} onNavigate={onNavigate} />
    </ConversationProvider>
  );
};

const VoiceExperience: React.FC<VoiceExperienceProps> = ({
  pathname,
  onNavigate,
}: VoiceExperienceProps) => {
  const routeState = getElevenLabsRoute(pathname);
  const [pendingAgent, setPendingAgent] = useState<AgentId>();
  const [callError, setCallError] = useState<string>();
  const [selectedEngine, setSelectedEngine] =
    useState<DemoEngineId>("elevenlabs");
  const [speakerEnabled, setSpeakerEnabled] = useState(true);

  useConversationClientTool<TravelClientTools>(
    "send_travel_details_form",
    (params) => {
      const missingFields = getMissingTravelFormFields(params);

      if (missingFields.length > 0) {
        return `missing_required_parameters: ${missingFields.join(", ")}. Ask the caller only for the missing details before saying the form was sent.`;
      }

      return "success: Paneer Hospitality's static travel details form was sent by mock SMS and mock email.";
    },
  );

  const conversation = useConversation({
    onDisconnect: (details) => {
      if (details.reason === "error") {
        setCallError(`Call disconnected: ${details.message}`);
      }
    },
    onError: (message) => {
      setCallError(message);
    },
    onUnhandledClientToolCall: (toolCall) => {
      setCallError(`Unhandled client tool requested: ${toolCall.tool_name}.`);
    },
  });
  const conversationRef = useRef(conversation);

  const pages = useMemo<Record<RouteId, PageConfig>>(
    () => ({
      explore: {
        agentId: "maya",
        agentName: "Maya",
        ariaLabel: "Paneer Hospitality vacation explorer",
        ctaLabel: "Plan My Trip",
        description: "Curated escapes, one call away.",
        titleOutline: "Fingertips",
        titleSolid: "World At Your",
      },
      concierge: {
        agentId: "aarav",
        agentName: "Aarav",
        ariaLabel: "Paneer Hospitality hotel concierge",
        ctaLabel: "Request Concierge Help",
        description: "Airport pickup, late checkout, dining and guest requests.",
        titleOutline: "Handled",
        titleSolid: "Every Stay",
      },
    }),
    [],
  );

  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  useEffect(
    () => () => {
      const activeConversation = conversationRef.current;

      if (
        activeConversation.status === "connected" ||
        activeConversation.status === "connecting"
      ) {
        try {
          activeConversation.endSession();
        } catch {
          // The provider can unmount after the SDK has already disconnected.
        }
      }
    },
    [],
  );

  function navigate(path: string) {
    setCallError(undefined);
    onNavigate(path);
  }

  function handleOpenCallScreen() {
    navigate(getElevenLabsPath(routeState.routeId, true));
  }

  async function handleStartCall(agentId: AgentId) {
    setPendingAgent(agentId);
    setCallError(undefined);

    try {
      await requestMicrophonePermission();
      const session = await createVoiceSession("elevenlabs", agentId);

      await conversation.startSession({
        signedUrl: session.signedUrl,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to start the call.";

      setCallError(message);
    } finally {
      setPendingAgent(undefined);
    }
  }

  function handleEndCall() {
    if (
      conversation.status === "connected" ||
      conversation.status === "connecting"
    ) {
      try {
        conversation.endSession();
        conversation.setMuted(false);
        conversation.setVolume({ volume: 1 });
      } catch {
        // The call UI should still close if the SDK has no active session.
      }
    }

    setSpeakerEnabled(true);
    navigate(getElevenLabsPath(routeState.routeId));
  }

  function handleToggleMute() {
    if (conversation.status !== "connected") {
      return;
    }

    conversation.setMuted(!conversation.isMuted);
  }

  function handleToggleSpeaker() {
    if (conversation.status !== "connected") {
      return;
    }

    const nextSpeakerEnabled = !speakerEnabled;

    conversation.setVolume({ volume: nextSpeakerEnabled ? 1 : 0 });
    setSpeakerEnabled(nextSpeakerEnabled);
  }

  const page = pages[routeState.routeId];
  const selectedCallAgent = getDefaultAgentForRoute(routeState.routeId);
  const selectedAgentName = agentNames[selectedCallAgent];
  const isStarting =
    pendingAgent === selectedCallAgent || conversation.status === "connecting";

  return (
    <div className="elevenlabs-experience">
      <main className="landing-page">
        <section
          className={`hero hero-${routeState.routeId} ${
            routeState.isCallRoute ? "hero-call" : ""
          }`}
          aria-label={page.ariaLabel}
        >
        {routeState.isCallRoute ? null : (
          <>
            <img
              className="hero-image"
              src={routeImages[routeState.routeId]}
              alt={
                routeState.routeId === "concierge"
                  ? "An elegant hospitality interior"
                  : "A tropical water destination"
              }
            />
            <div className="water-motion" aria-hidden="true" />
            <div className="water-shimmer" aria-hidden="true" />
            <div className="blue-overlay" aria-hidden="true" />
          </>
        )}

        {routeState.isCallRoute ? (
          <CallView
            agentId={selectedCallAgent}
            agentName={selectedAgentName}
            callError={callError}
            engine={selectedEngine}
            isMuted={conversation.isMuted}
            onEndCall={handleEndCall}
            onEngineChange={setSelectedEngine}
            onHome={handleEndCall}
            onStartCall={handleStartCall}
            onToggleMute={handleToggleMute}
            onToggleSpeaker={handleToggleSpeaker}
            isStarting={isStarting}
            speakerEnabled={speakerEnabled}
            status={conversation.status}
          />
        ) : (
          <>
            <div className="brand-lockup" aria-label="Paneer Hospitality">
              <div className="brand-monogram" aria-hidden="true">
                PH
              </div>
              <div>
                <strong>Paneer</strong>
                <span>Hospitality</span>
              </div>
            </div>

            <nav className="route-switcher" aria-label="AI employees">
              <button
                className={routeState.routeId === "explore" ? "active" : undefined}
                type="button"
                onClick={() => navigate(getElevenLabsPath("explore"))}
              >
                Explore
              </button>
              <button
                className={
                  routeState.routeId === "concierge" ? "active" : undefined
                }
                type="button"
                onClick={() => navigate(getElevenLabsPath("concierge"))}
              >
                Concierge
              </button>
            </nav>

            <div className="hero-content">
              <h1 className="hero-title">
                <span className="solid-text">{page.titleSolid}</span>
                <span>{page.titleOutline}</span>
              </h1>
              <p className="description">{page.description}</p>

              <button
                className="call-button"
                type="button"
                onClick={handleOpenCallScreen}
              >
                {phoneIcon()}
                {page.ctaLabel}
              </button>

              {callError ? (
                <p className="call-error" role="alert">
                  {callError}
                </p>
              ) : null}
            </div>

          </>
        )}
        </section>
      </main>
    </div>
  );
};

function CallView({
  agentId,
  agentName,
  callError,
  engine,
  isStarting,
  isMuted,
  onEndCall,
  onEngineChange,
  onHome,
  onStartCall,
  onToggleMute,
  onToggleSpeaker,
  speakerEnabled,
  status,
}: {
  agentId: AgentId;
  agentName: string;
  callError?: string;
  engine: DemoEngineId;
  isStarting: boolean;
  isMuted: boolean;
  onEndCall: () => void;
  onEngineChange: (engine: DemoEngineId) => void;
  onHome: () => void;
  onStartCall: (agentId: AgentId) => void;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  speakerEnabled: boolean;
  status: string;
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const isActive = status === "connected";
  const isConnecting = status === "connecting" || isStarting;
  const hasStarted = isActive || isConnecting;
  const statusText =
    status === "connected"
      ? `You’re connected to ${agentName}`
      : isConnecting
        ? `Connecting to ${agentName}`
        : `Ready to call ${agentName}`;

  useEffect(() => {
    if (!isActive) {
      setElapsedSeconds(0);
      return undefined;
    }

    const interval = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isActive]);

  return (
    <div className="call-view call-screen" aria-label={`${agentName} active call`}>
      <button
        className="home-button"
        type="button"
        onClick={onHome}
        aria-label="Back to home"
      >
        {houseIcon()}
      </button>

      <div className="call-demo-controls" aria-label="Demo controls">
        <label>
          <span>Engine</span>
          <select
            value={engine}
            disabled={hasStarted}
            onChange={(event) =>
              onEngineChange(event.currentTarget.value as DemoEngineId)
            }
          >
            <option value="elevenlabs">ElevenLabs</option>
            <option value="agora" disabled>
              Agora
            </option>
          </select>
        </label>
      </div>

      <aside className="call-metrics" aria-label="Live metrics">
        <div className="metrics-header">
          <p>Session Details</p>
          <span aria-hidden="true">-</span>
        </div>
        <div className="metrics-status">
          <span className="status-dot" aria-hidden="true" />
          {isActive ? "Connected" : isConnecting ? "Connecting" : "Ready"}
        </div>
        <div className="metrics-summary">
          <div>
            <span className="metrics-icon" aria-hidden="true">
              00
            </span>
            <strong>--</strong>
            <small>Total E2E</small>
          </div>
          <div>
            <span className="metrics-icon" aria-hidden="true">
              ||
            </span>
            <strong>--</strong>
            <small>LLM TTFB</small>
          </div>
        </div>
        <dl>
          <div>
            <dt>VAD Delay</dt>
            <dd>-- ms</dd>
          </div>
          <div>
            <dt>ASR Latency</dt>
            <dd>-- ms</dd>
          </div>
          <div>
            <dt>TTS TTFB</dt>
            <dd>-- ms</dd>
          </div>
          <div>
            <dt>Audio</dt>
            <dd>{isActive ? "Secure stream" : "Not started"}</dd>
          </div>
          <div>
            <dt>Engine</dt>
            <dd>{engine === "elevenlabs" ? "ElevenLabs" : "Agora"}</dd>
          </div>
          <div>
            <dt>Agent</dt>
            <dd>{agentName}</dd>
          </div>
        </dl>
        <div className="metrics-footer">
          <span>Last updated just now</span>
          <span aria-hidden="true">↻</span>
        </div>
      </aside>

      <div className="agent-status call-content">
        <div className="agent-avatar" aria-hidden="true">
          <span>{agentName.slice(0, 1)}</span>
        </div>
        <p className="call-status">
          <span className="status-dot" aria-hidden="true" />
          {isActive ? "Live" : isConnecting ? "Connecting" : "Ready"} ·{" "}
          {formatCallDuration(elapsedSeconds)}
        </p>
        <h1 className="call-title">{statusText}</h1>

        <div
          className={isActive ? "waveform active" : "waveform waveform-idle"}
          aria-label="Live voice waveform"
        >
          {waveformBars.map((bar) => (
            <span key={bar} style={{ animationDelay: `${bar * 70}ms` }} />
          ))}
        </div>

      </div>

      {callError ? (
        <p className="call-error call-screen-error" role="alert">
          {callError}
        </p>
      ) : null}

      <div
        className={hasStarted ? "call-controls" : "call-controls call-controls-idle"}
        aria-label="Call controls"
      >
        {hasStarted ? (
          <>
            <button
              className={isMuted ? "control-button active" : "control-button"}
              type="button"
              onClick={onToggleMute}
              aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
            >
              {isMuted ? micOffIcon() : micIcon()}
            </button>
            <button
              className={
                speakerEnabled ? "control-button active" : "control-button"
              }
              type="button"
              onClick={onToggleSpeaker}
              aria-label={speakerEnabled ? "Disable speaker" : "Enable speaker"}
            >
              {speakerEnabled ? speakerIcon() : speakerOffIcon()}
            </button>
            <button
              className="control-button end-call"
              type="button"
              onClick={onEndCall}
            >
              {phoneOffIcon()}
              End Call
            </button>
          </>
        ) : (
          <button
            className="control-button start-call-control"
            type="button"
            onClick={() => onStartCall(agentId)}
          >
            {phoneIcon()}
            Call {agentName}
          </button>
        )}
      </div>
    </div>
  );
}

async function requestMicrophonePermission() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Microphone access is not available in this browser.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  for (const track of stream.getTracks()) {
    track.stop();
  }
}

function getMissingTravelFormFields(params: TravelDetailsFormParams) {
  return [
    ["request_type", params.request_type],
    ["trip_summary", params.trip_summary],
    ["recipient_email", params.recipient_email],
    ["recipient_phone", params.recipient_phone],
  ]
    .filter(([, value]) => !value?.trim())
    .map(([field]) => field);
}
