import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, usePaginatedQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { isPhoneQuery } from "../utils/phone";

export function useClientSearch(searchQuery) {
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery ?? "");
  const debounceRef = useRef(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(searchQuery ?? ""), 500);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  const isSearching = debouncedQuery.trim().length > 0;
  const phoneMode = isPhoneQuery(debouncedQuery);

  const nameResults = useQuery(
    api.clients.searchByName,
    isSearching && !phoneMode ? { query: debouncedQuery } : "skip",
  );
  const phoneResults = useQuery(
    api.clients.searchByPhone,
    isSearching && phoneMode ? { query: debouncedQuery } : "skip",
  );
  const totalCount = useQuery(api.clients.getTotalCount);

  const { results: pagedContacts, status, loadMore } = usePaginatedQuery(
    api.clients.listClients,
    !isSearching ? {} : "skip",
    { initialNumItems: 50 },
  );

  const contacts = isSearching
    ? (phoneMode ? phoneResults : nameResults) ?? []
    : pagedContacts ?? [];

  // Treat the debounce window as loading too, so the list switches to the skeleton
  // the moment the user starts typing rather than waiting 500ms.
  const isPending = (searchQuery ?? "").trim() !== debouncedQuery.trim();
  const isLoading = isPending || (
    isSearching
      ? nameResults === undefined && phoneResults === undefined
      : status === "LoadingFirstPage"
  );

  const canLoadMore = !isSearching && status === "CanLoadMore";

  const handleIntersect = useCallback(
    (entries) => { if (entries[0].isIntersecting && canLoadMore) loadMore(50); },
    [canLoadMore, loadMore],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersect, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  return {
    contacts,
    isLoading,
    isSearching,
    status,
    totalCount,
    sentinelRef,
  };
}
