const DEFAULT_BASE_URL = "http://localhost:11434/v1";
const DEFAULT_MODEL = "llama3.1";
const DEFAULT_TIMEOUT_MS = 120_000;

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CallChatOptions {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface ChatCompletionResult {
  content: string;
  finishReason: string | null;
}

export class LlmClientError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "LlmClientError";
  }
}

function getBaseUrl(): string {
  return process.env.LLM_BASE_URL || DEFAULT_BASE_URL;
}

function getModel(): string {
  return process.env.LLM_MODEL || DEFAULT_MODEL;
}

function getApiKey(): string | undefined {
  return process.env.LLM_API_KEY || undefined;
}

export async function callChat(
  messages: ChatMessage[],
  options: CallChatOptions = {},
): Promise<ChatCompletionResult> {
  const baseUrl = getBaseUrl();
  const model = getModel();
  const temperature = options.temperature ?? 0.1;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  if (options.signal) {
    options.signal.addEventListener("abort", () => controller.abort(), {
      once: true,
    });
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const apiKey = getApiKey();
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: options.maxTokens ?? 4096,
        stream: false,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new LlmClientError(
        `LLM request failed: ${response.status} ${response.statusText}`,
        body,
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: { content?: string };
        finish_reason?: string | null;
      }>;
    };

    const choice = data.choices?.[0];
    const content = choice?.message?.content ?? "";

    if (!content) {
      throw new LlmClientError("LLM returned empty content");
    }

    return {
      content,
      finishReason: choice?.finish_reason ?? null,
    };
  } catch (err) {
    if (err instanceof LlmClientError) {
      throw err;
    }
    if (err instanceof Error && err.name === "AbortError") {
      throw new LlmClientError("LLM request timed out", err);
    }
    throw new LlmClientError("LLM request failed", err);
  } finally {
    clearTimeout(timeout);
  }
}
