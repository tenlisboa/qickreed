import { headers } from "next/headers";
import type { Logger } from "pino";
import { logger } from "@/utils/logging/logger";

export async function getRequestLogger(context?: {
  userId?: string;
  module?: string;
}): Promise<Logger> {
  const headerList = await headers();
  const requestId = headerList.get("x-request-id") ?? crypto.randomUUID();

  return logger.child({
    requestId,
    ...(context?.module ? { module: context.module } : {}),
    ...(context?.userId ? { userId: context.userId } : {}),
  });
}
