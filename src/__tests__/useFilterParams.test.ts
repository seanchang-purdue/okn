// Regression test: a shared link must keep its filters when the tab already
// has different filters persisted in localStorage.
//
// There is no React hook testing library in this repo, so React's hooks are
// replaced with a minimal slot-based runtime that keeps the one property the
// bug depends on: a component's passive effects run in declaration order in
// one flush, each closing over the values from the render that scheduled it.
// On mount that means the URL->store hydration effect and the store->URL
// effect run back to back, and the second one still sees the persisted
// (pre-hydration) values captured at render time.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseDate } from "@internationalized/date";

const runtime = vi.hoisted(() => {
  type Slot = { initialized: boolean; value: unknown; deps?: unknown[] };

  const state = {
    slots: [] as Slot[],
    cursor: 0,
    pendingEffects: [] as Array<() => void>,
    pathname: "/",
    search: "",
    pendingNavigation: null as string | null,
  };

  // Next applies router.replace() as a transition: store-driven re-renders
  // land first, and the new search params show up on a later render.
  const replace = vi.fn((url: string) => {
    const queryIndex = url.indexOf("?");
    state.pendingNavigation = queryIndex >= 0 ? url.slice(queryIndex + 1) : "";
  });
  const router = { replace };

  const nextSlot = (): Slot => {
    const index = state.cursor++;
    if (!state.slots[index]) {
      state.slots[index] = { initialized: false, value: undefined };
    }
    return state.slots[index];
  };

  const depsChanged = (prev: unknown[] | undefined, next: unknown[] | undefined) =>
    !prev ||
    !next ||
    prev.length !== next.length ||
    prev.some((value, index) => !Object.is(value, next[index]));

  const react = {
    useRef<T>(initial: T) {
      const slot = nextSlot();
      if (!slot.initialized) {
        slot.initialized = true;
        slot.value = { current: initial };
      }
      return slot.value as { current: T };
    },
    useState<T>(initial: T) {
      const slot = nextSlot();
      if (!slot.initialized) {
        slot.initialized = true;
        slot.value = initial;
      }
      const setValue = (next: T) => {
        slot.value = next;
      };
      return [slot.value as T, setValue] as const;
    },
    useMemo<T>(factory: () => T, deps: unknown[]) {
      const slot = nextSlot();
      if (!slot.initialized || depsChanged(slot.deps, deps)) {
        slot.initialized = true;
        slot.value = factory();
        slot.deps = deps;
      }
      return slot.value as T;
    },
    useEffect(effect: () => void, deps: unknown[]) {
      const slot = nextSlot();
      if (!slot.initialized || depsChanged(slot.deps, deps)) {
        slot.initialized = true;
        slot.deps = deps;
        state.pendingEffects.push(effect);
      }
    },
  };

  return { state, router, replace, react };
});

vi.mock("react", () => runtime.react);

vi.mock("next/navigation", () => ({
  useRouter: () => runtime.router,
  usePathname: () => runtime.state.pathname,
  useSearchParams: () => new URLSearchParams(runtime.state.search),
}));

// useStore returns the store's value at render time, like the real hook.
vi.mock("@nanostores/react", () => ({
  useStore: <T>(store: { get: () => T }) => store.get(),
}));

import useFilterParams from "../hooks/useFilterParams";
import { dateRangeStore, filtersStore } from "../stores/filterStore";

/** Stands in for ChatMapApp, the component that calls the hook. */
const HookHost = () => {
  useFilterParams();
  return null;
};

/** Render the hook once and flush the effects that render scheduled. */
const render = () => {
  runtime.state.cursor = 0;
  HookHost();
  const effects = runtime.state.pendingEffects.splice(0);
  effects.forEach((effect) => effect());
  return effects.length;
};

/**
 * Re-render until no effect is scheduled and no navigation is pending, i.e.
 * the stores and the URL have converged.
 */
const settle = () => {
  for (let i = 0; i < 20; i += 1) {
    if (render() > 0) continue;
    if (runtime.state.pendingNavigation === null) return;
    runtime.state.search = runtime.state.pendingNavigation;
    runtime.state.pendingNavigation = null;
  }
  throw new Error("useFilterParams did not settle after 20 renders");
};

const mount = (search: string) => {
  runtime.state.slots = [];
  runtime.state.pendingEffects = [];
  runtime.state.pendingNavigation = null;
  runtime.state.search = search;
  render();
};

const currentParams = () => new URLSearchParams(runtime.state.search);

const persistStaleSession = () => {
  // What localStorage holds from the user's previous session in another tab.
  filtersStore.set({ selectedKeys: [], city: "Chicago" });
  dateRangeStore.set({
    start: parseDate("2021-03-01"),
    end: parseDate("2021-03-31"),
  });
};

describe("useFilterParams", () => {
  beforeEach(() => {
    runtime.replace.mockClear();
    runtime.state.pathname = "/";
    filtersStore.set({ selectedKeys: [] });
    dateRangeStore.set(null);
  });

  it("keeps a shared link's filters when other filters are persisted", () => {
    persistStaleSession();
    const shared = "city=Philadelphia&dateEnd=2023-06-30&dateStart=2023-01-01";

    mount(shared);
    settle();

    expect(currentParams().get("dateStart")).toBe("2023-01-01");
    expect(currentParams().get("dateEnd")).toBe("2023-06-30");
    expect(currentParams().get("city")).toBe("Philadelphia");
    expect(dateRangeStore.get()?.start.toString()).toBe("2023-01-01");
    expect(dateRangeStore.get()?.end.toString()).toBe("2023-06-30");
    expect(filtersStore.get().city).toBe("Philadelphia");
    // The URL already matches the stores, so there is nothing to replace.
    expect(runtime.replace).not.toHaveBeenCalled();
  });

  it("still writes filter changes made after mount into the URL", () => {
    persistStaleSession();
    mount("city=Philadelphia&dateEnd=2023-06-30&dateStart=2023-01-01&embed=true");
    settle();

    dateRangeStore.set({
      start: parseDate("2022-05-01"),
      end: parseDate("2022-05-31"),
    });
    settle();

    expect(runtime.replace).toHaveBeenCalledTimes(1);
    expect(currentParams().get("dateStart")).toBe("2022-05-01");
    expect(currentParams().get("dateEnd")).toBe("2022-05-31");
    expect(currentParams().get("city")).toBe("Philadelphia");
    // Params the hook does not manage survive the rewrite.
    expect(currentParams().get("embed")).toBe("true");
  });
});
