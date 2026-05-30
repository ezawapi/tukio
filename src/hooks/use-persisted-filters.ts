import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { SortKey } from "@/components/DashboardFilters";

export interface FilterState {
  search: string;
  city: string;
  sort: SortKey;
  group: boolean;
}

const LS_PREFIX = "tukio:filters:";

const DEFAULTS: FilterState = {
  search: "",
  city: "all",
  sort: "date_desc",
  group: false,
};

/**
 * Persists dashboard filter state (search, city, sort, optional group)
 * in both the URL query string (scoped by `scope`) and localStorage.
 * On first mount the URL wins; otherwise localStorage hydrates the state.
 */
export const usePersistedFilters = (scope: string, supportGroup = false) => {
  const [params, setParams] = useSearchParams();
  const lsKey = LS_PREFIX + scope;
  const qKey = `${scope}_q`;
  const cKey = `${scope}_city`;
  const sKey = `${scope}_sort`;
  const gKey = `${scope}_group`;

  const initial = (): FilterState => {
    const urlQ = params.get(qKey);
    const urlC = params.get(cKey);
    const urlS = params.get(sKey) as SortKey | null;
    const urlG = params.get(gKey);
    if (urlQ !== null || urlC || urlS || urlG) {
      return {
        search: urlQ ?? DEFAULTS.search,
        city: urlC || DEFAULTS.city,
        sort: (urlS as SortKey) || DEFAULTS.sort,
        group: urlG === "1",
      };
    }
    try {
      const raw = localStorage.getItem(lsKey);
      if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {
      // ignore
    }
    return { ...DEFAULTS };
  };

  const [state, setState] = useState<FilterState>(initial);
  const firstRun = useRef(true);

  useEffect(() => {
    try {
      localStorage.setItem(lsKey, JSON.stringify(state));
    } catch {
      // ignore quota
    }
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (state.search) next.set(qKey, state.search);
        else next.delete(qKey);
        if (state.city && state.city !== "all") next.set(cKey, state.city);
        else next.delete(cKey);
        if (state.sort && state.sort !== "date_desc") next.set(sKey, state.sort);
        else next.delete(sKey);
        if (supportGroup && state.group) next.set(gKey, "1");
        else next.delete(gKey);
        return next;
      },
      { replace: true },
    );
    firstRun.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.search, state.city, state.sort, state.group]);

  return {
    search: state.search,
    setSearch: (v: string) => setState((s) => ({ ...s, search: v })),
    city: state.city,
    setCity: (v: string) => setState((s) => ({ ...s, city: v })),
    sort: state.sort,
    setSort: (v: SortKey) => setState((s) => ({ ...s, sort: v })),
    group: state.group,
    setGroup: (v: boolean) => setState((s) => ({ ...s, group: v })),
  };
};
