import pino from "pino";

const isDev = process.env.NODE_ENV === "development";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  base: { env: process.env.NODE_ENV },
  redact: {
    paths: [
      "*.password",
      "*.token",
      "*.apiKey",
      "authorization",
      "*.access_token",
      "*.refresh_token",
      "*.secret",
    ],
    censor: "[REDACTED]",
  },
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss" },
        },
      }
    : {}),
});
