require('dotenv').config();

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const fetch = require('node-fetch');
const { RtcTokenBuilder, RtcRole } = require('agora-token');

const debtCollectionPrompt = fs.readFileSync(
  path.join(__dirname, 'debt-collection-voice-agent-prompt.md'),
  'utf8',
);

const app = express();
const port = Number(process.env.PORT || 3000);
const appId = process.env.AGORA_APP_ID || process.env.APP_ID;
const appCertificate = process.env.AGORA_APP_CERTIFICATE || process.env.APP_CERTIFICATE;
const customerId = process.env.AGORA_CUSTOMER_ID || process.env.CUSTOMER_ID;
const customerSecret = process.env.AGORA_CUSTOMER_SECRET || process.env.CUSTOMER_SECRET || process.env.CUSTOMER_CERTIFICATE;
const sessions = new Map();

app.use(express.json());
app.use(express.static('public', {
  setHeaders(response) {
    response.set('Cache-Control', 'no-store');
  },
}));

function configurationError(response) {
  return response.status(503).json({
    error: 'Agora is not configured. Add app credentials and REST customer credentials to .env.',
  });
}

function isConfigured() {
  return Boolean(appId && appCertificate && customerId && customerSecret);
}

function isValidChannel(channel) {
  return typeof channel === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(channel);
}

function agoraAuthorization() {
  return `Basic ${Buffer.from(`${customerId}:${customerSecret}`).toString('base64')}`;
}

function buildToken(channel, uid) {
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60;
  return RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channel,
    uid,
    RtcRole.PUBLISHER,
    expiresAt,
  );
}

function textSetting(value, fallback, maxLength) {
  return typeof value === 'string' && value.trim() && value.trim().length <= maxLength
    ? value.trim()
    : fallback;
}

function managedConfig(config = {}) {
  return {
    agentName: textSetting(config.agentName, 'Nova', 40),
    language: textSetting(config.language, 'en-US', 16),
    asrModel: textSetting(config.asrModel, 'nova-3', 64),
    llmModel: textSetting(config.llmModel, 'gpt-4o-mini', 64),
    ttsModel: textSetting(config.ttsModel, 'speech-2.6-turbo', 64),
    voiceId: textSetting(config.voiceId, 'English_captivating_female1', 128),
    systemPrompt: textSetting(config.systemPrompt, 'You are a warm, concise and helpful voice assistant.', 2000),
    greeting: textSetting(config.greeting, 'Hello! What would you like to talk about?', 500),
    maxHistory: Number.isInteger(config.maxHistory) && config.maxHistory >= 1 && config.maxHistory <= 50
      ? config.maxHistory
      : 10,
  };
}

function fullAgentConfig(value, channel, userUid) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const properties = value.properties;
  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) return null;
  const { use_debt_collection_prompt: useDebtCollectionPrompt, ...configuredProperties } = properties;
  const llm = configuredProperties.llm && typeof configuredProperties.llm === 'object'
    ? { ...configuredProperties.llm }
    : null;
  if (useDebtCollectionPrompt && llm) {
    llm.system_messages = [{ role: 'system', content: debtCollectionPrompt }];
  }
  return {
    name: textSetting(value.name, `web-demo-${crypto.randomUUID()}`, 128),
    properties: {
      ...configuredProperties,
      ...(llm ? { llm } : {}),
      // Replaced on every launch so client input cannot reuse stale credentials.
      channel,
      token: buildToken(channel, 0),
      agent_rtc_uid: '0',
      remote_rtc_uids: [String(userUid)],
      enable_string_uid: false,
    },
  };
}

function debtCollectionAgentPayload() {
  return {
    name: `debt-collection-voice-agent-${crypto.randomUUID()}`,
    properties: {
      channel: 'testchan',
      token: buildToken('testchan', 20009),
      agent_rtc_uid: '20009',
      remote_rtc_uids: ['*'],
      idle_timeout: 20,
      asr: {
        credential_mode: 'managed',
        vendor: 'deepgram',
        language: 'en-IN',
        params: { url: 'wss://api.deepgram.com/v1/listen', model: 'nova-3', language: 'multi' },
      },
      llm: {
        credential_mode: 'managed',
        vendor: 'openai',
        style: 'openai',
        url: 'https://api.openai.com/v1/chat/completions',
        max_history: 32,
        system_messages: [{ role: 'system', content: debtCollectionPrompt }],
        greeting_message: 'Hello, this is Maya calling from the bank. This call may be recorded for quality and training purposes. Am I speaking with Samayak?',
        greeting_configs: { mode: 'single_first', delay_ms: 0, interruptable: false },
        failure_message: 'Sorry, I am having trouble responding right now. Please give me a moment.',
        params: { model: 'gpt-4.1' },
      },
      tts: {
        credential_mode: 'managed',
        vendor: 'microsoft',
        params: { region: 'eastus', voice_name: 'en-US-AndrewMultilingualNeural', speed: 1.2, volume: 100, sample_rate: 24000 },
        skip_patterns: [3, 4, 5],
      },
      turn_detection: { mode: 'default', config: { speech_threshold: 0.5, start_of_speech: { mode: 'vad', vad_config: { interrupt_duration_ms: 160, speaking_interrupt_duration_ms: 240, prefix_padding_ms: 800 } }, end_of_speech: { mode: 'semantic', semantic_config: { silence_duration_ms: 320, max_wait_ms: 3000, pause_state_enabled: true } } } },
      interruption: { enable: true, mode: 'start_of_speech' },
      filler_words: { enable: true, trigger: { mode: 'fixed_time', fixed_time_config: { response_wait_ms: 1500 } }, content: { mode: 'static', static_config: { phrases: ['Let me think about that.', 'One moment, please.', 'Let me check how best to explain that.'], selection_rule: 'shuffle' } } },
      parameters: { silence_config: { timeout_ms: 12000, action: 'think', content: 'The caller has been silent. Check once whether they are still present. If you already checked and the silence continued, say goodbye briefly.' }, farewell_config: { graceful_enabled: true, graceful_timeout_seconds: 30 }, opt_out: false },
      labels: { use_case: 'debt_collection_voice_agent', brand: 'bank' },
    },
  };
}

app.get('/api/health', (_request, response) => {
  response.json({ configured: isConfigured() });
});

app.post('/api/rtc-credentials', (request, response) => {
  if (!isConfigured()) return configurationError(response);

  const { channel } = request.body;
  if (!isValidChannel(channel)) {
    return response.status(400).json({ error: 'Channel names may contain letters, numbers, _ and - only.' });
  }

  const userUid = crypto.randomInt(100000, 999999);
  const token = buildToken(channel, userUid);

  return response.status(201).json({ appId, channel, token, uid: userUid });
});

app.post('/api/sessions', async (request, response) => {
  if (!isConfigured()) return configurationError(response);

  const { channel, userUid, preset } = request.body;
  if (!isValidChannel(channel) || !Number.isSafeInteger(userUid) || userUid < 1) {
    return response.status(400).json({ error: 'A valid channel and user ID are required.' });
  }

  const config = managedConfig(request.body.config);
  const agentUid = 0;
  const name = `web-demo-${crypto.randomUUID()}`;
  const agentToken = buildToken(channel, agentUid);

  const customPayload = fullAgentConfig(request.body.fullConfig, channel, userUid);
  const payload = customPayload || (preset === 'debt-collection-voice-agent' ? debtCollectionAgentPayload() : {
    name,
    properties: {
      channel,
      token: agentToken,
      agent_rtc_uid: String(agentUid),
      remote_rtc_uids: [String(userUid)],
      enable_string_uid: false,
      idle_timeout: 120,
      asr: {
        credential_mode: 'managed',
        vendor: 'deepgram',
        params: {
          url: 'wss://api.deepgram.com/v1/listen',
          model: config.asrModel,
          language: config.language,
        },
      },
      llm: {
        credential_mode: 'managed',
        vendor: 'openai',
        style: 'openai',
        url: 'https://api.openai.com/v1/chat/completions',
        system_messages: [{ role: 'system', content: config.systemPrompt }],
        greeting_message: config.greeting,
        failure_message: 'Sorry, I was unable to answer that. Please try again.',
        max_history: config.maxHistory,
        params: { model: config.llmModel },
      },
      tts: {
        credential_mode: 'managed',
        vendor: 'minimax',
        params: {
          url: 'wss://api.minimax.io/ws/v1/t2a_v2',
          model: config.ttsModel,
          voice_setting: { voice_id: config.voiceId },
        },
      },
    },
  });

  try {
    const agentResponse = await fetch(
      `https://api.agora.io/api/conversational-ai-agent/v2/projects/${appId}/join`,
      {
        method: 'POST',
        headers: { Authorization: agoraAuthorization(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
    const agentData = await agentResponse.json();
    if (!agentResponse.ok) {
      console.error('ConvoAI join failed:', agentData);
      return response.status(agentResponse.status).json({
        error: agentData.message || agentData.error || 'Agora could not start the voice agent.',
      });
    }

    const appliedConfig = preset === 'debt-collection-voice-agent' ? {
      agentName: 'Maya',
      language: 'en-IN',
      asrModel: 'nova-3',
      llmModel: 'gpt-4.1',
      ttsModel: 'microsoft',
      voiceId: 'en-US-AndrewMultilingualNeural',
      systemPrompt: debtCollectionPrompt,
      greeting: 'Hello, this is Maya calling from the bank. This call may be recorded for quality and training purposes. Am I speaking with Samayak?',
      maxHistory: 32,
    } : config;
    sessions.set(agentData.agent_id, { channel, createdAt: Date.now() });
    return response.status(201).json({ agentId: agentData.agent_id, agentName: appliedConfig.agentName, config: appliedConfig });
  } catch (error) {
    console.error('ConvoAI request failed:', error);
    return response.status(502).json({ error: 'Unable to reach the Agora ConvoAI service.' });
  }
});

app.delete('/api/sessions/:agentId', async (request, response) => {
  if (!isConfigured()) return configurationError(response);

  try {
    const agentResponse = await fetch(
      `https://api.agora.io/api/conversational-ai-agent/v2/projects/${appId}/agents/${encodeURIComponent(request.params.agentId)}/leave`,
      { method: 'POST', headers: { Authorization: agoraAuthorization() } },
    );
    if (!agentResponse.ok) {
      const agentData = await agentResponse.json();
      return response.status(agentResponse.status).json({ error: agentData.message || 'Unable to stop the agent.' });
    }
    sessions.delete(request.params.agentId);
    return response.status(204).end();
  } catch (error) {
    console.error('ConvoAI leave failed:', error);
    return response.status(502).json({ error: 'Unable to reach the Agora ConvoAI service.' });
  }
});

app.listen(port, () => {
  console.log(`Voice agent demo listening at http://localhost:${port}`);
});
