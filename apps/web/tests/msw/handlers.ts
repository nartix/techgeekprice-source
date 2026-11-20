import type { RequestHandler } from "msw";

import { adminHandlers } from "./admin-handlers";

export const handlers: RequestHandler[] = [...adminHandlers];
