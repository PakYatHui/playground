import { timingSafeEqual } from "node:crypto";

import { getLeadEnv } from "./env";

function toBuffer(value: string) {
  return Buffer.from(value, "utf8");
}

export function readBearerToken(headerValue: null | string) {
  if (!headerValue) {
    return null;
  }

  const [scheme, token] = headerValue.split(/\s+/, 2);

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token.trim();
}

export function isAuthorizedAdminToken(candidate: null | string) {
  if (!candidate) {
    return false;
  }

  const expected = getLeadEnv().adminToken;
  const expectedBuffer = toBuffer(expected);
  const candidateBuffer = toBuffer(candidate);

  if (expectedBuffer.length !== candidateBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, candidateBuffer);
}
