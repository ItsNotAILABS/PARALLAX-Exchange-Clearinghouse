import { useActor as _useActor } from "@caffeineai/core-infrastructure";
import { createActor } from "../backend";

type ParallaxActorHandle = {
  actor: any | null;
  isFetching: boolean;
  isAuthenticated: boolean;
};

export function useActor(): ParallaxActorHandle {
  const handle = _useActor(createActor) as { actor: any | null; isFetching: boolean; isAuthenticated?: boolean };
  return {
    actor: handle.actor,
    isFetching: handle.isFetching,
    isAuthenticated: handle.isAuthenticated ?? Boolean(handle.actor),
  };
}
