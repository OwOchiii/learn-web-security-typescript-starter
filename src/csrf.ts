import type { RequestHandler } from "express";
import { sendErrorPage } from "./errors.ts";
import {timingSafeEqual} from "node:crypto";

const FORBIDDEN_MESSAGE = "This request did not come from the app.";

export function validateRequestOrigin(appOrigin: string): RequestHandler {
  return (req, res, next) => {
    if (req.method !== "POST") {
      next();
      return;
    }

    const origin = req.header("Origin");
    if (origin !== undefined) {
      if (origin === appOrigin) {
        next();
      } else {
        sendErrorPage(res, 403, "Forbidden", FORBIDDEN_MESSAGE);
      }
      return;
    }

    const referer = req.header("Referer");
    try {
      if (new URL(referer ?? "").origin === appOrigin) {
        next();
        return;
      }
    } catch {
      // invalid or missing Referer URL
    }
    sendErrorPage(res, 403, "Forbidden", FORBIDDEN_MESSAGE);
  };
}

export function csrfTokensMatch(_expected: string, _actual: unknown): boolean {
  if (typeof _actual !== "string") {
    return false;
  }

  const buffer_expected = Buffer.from(_expected);
  const buffer_actual = Buffer.from(_actual);

  if (buffer_expected.length !== buffer_actual.length) {
    return false;
  }

  return timingSafeEqual(buffer_expected, buffer_actual);

}
