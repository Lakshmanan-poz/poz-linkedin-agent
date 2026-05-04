import { PostStatus } from "./types";
import { VALID_TRANSITIONS } from "./constants";

export function canTransition(from: PostStatus, to: PostStatus): boolean {
  const allowed = VALID_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export function getNextStatuses(current: PostStatus): PostStatus[] {
  return VALID_TRANSITIONS[current] || [];
}
