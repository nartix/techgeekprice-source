import type { AdminIdentity } from "../types/admin.types";

type Listener = (identity: AdminIdentity | null) => void;

let currentIdentity: AdminIdentity | null = null;
const listeners = new Set<Listener>();

export function getAdminIdentity(): AdminIdentity | null {
  return currentIdentity;
}

export function setAdminIdentity(identity: AdminIdentity): void {
  currentIdentity = {
    id: identity.id,
    username: identity.username,
    roles: [...identity.roles],
    permissions: [...identity.permissions],
    sessionScope: identity.sessionScope,
  };
  notify();
}

export function clearAdminIdentity(): void {
  currentIdentity = null;
  notify();
}

export function subscribeAdminIdentity(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(): void {
  for (const listener of listeners) {
    listener(currentIdentity);
  }
}
