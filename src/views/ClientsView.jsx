import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, usePaginatedQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { isPhoneQuery } from "../utils/phone";
import Icon from "../assets/Icon";
import ClientCard from "../components/ClientCard";
import NewClientModal from "../components/NewClientModal";

export default function ClientsView({ searchQuery, onSelectContact }) {
  const [showModal,      setShowModal]      = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery ?? "");
  const debounceRef  = useRef(null);
  const sentinelRef  = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(searchQuery ?? ""), 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  const isSearching = debouncedQuery.trim().length > 0;
  const phoneMode   = isPhoneQuery(debouncedQuery);

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

  const isLoading = isSearching
    ? nameResults === undefined && phoneResults === undefined
    : status === "LoadingFirstPage";

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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Clients</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {totalCount != null ? `${totalCount} total clients` : "Manage your client list and their pets"}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors"
        >
          <Icon name="plus" className="w-4 h-4" />
          New Client
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="bg-background-card border border-border rounded-2xl shadow-card overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-0 animate-pulse">
              <div className="w-9 h-9 rounded-xl bg-border shrink-0" />
              <div className="flex-1">
                <div className="h-3.5 bg-border rounded w-40 mb-2" />
                <div className="h-3 bg-background-sidebar rounded w-56" />
              </div>
              <div className="hidden sm:block h-3 bg-background-sidebar rounded w-28" />
              <div className="hidden md:block h-3 bg-background-sidebar rounded w-20" />
              <div className="h-6 bg-background-sidebar rounded-full w-12" />
            </div>
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="bg-background-card border border-border rounded-2xl shadow-card py-20 text-center">
          <Icon name="clients" className="w-10 h-10 mx-auto mb-3 text-border" />
          <p className="text-sm font-medium text-text-secondary">No clients found</p>
          {isSearching
            ? <p className="text-xs text-text-muted mt-1">Try a different name or phone number</p>
            : <button
                onClick={() => setShowModal(true)}
                className="mt-3 text-sm text-primary hover:text-primary-hover font-medium transition-colors"
              >
                Add your first client
              </button>
          }
        </div>
      ) : (
        <div className="bg-background-card border border-border rounded-2xl shadow-card overflow-hidden">
          {/* Column headers */}
          <div className="flex items-center gap-4 px-5 py-2.5 border-b border-border bg-background-sidebar">
            <div className="w-9 shrink-0" />
            <div className="flex-1 text-xs font-medium text-text-muted uppercase tracking-widest">Name</div>
            <div className="hidden sm:block text-xs font-medium text-text-muted uppercase tracking-widest w-36 shrink-0">Phone</div>
            <div className="hidden md:block text-xs font-medium text-text-muted uppercase tracking-widest w-28 shrink-0">Last Visit</div>
            <div className="text-xs font-medium text-text-muted uppercase tracking-widest shrink-0">Pets</div>
            <div className="w-4 shrink-0" />
          </div>

          {/* Rows */}
          <div className="divide-y divide-border">
            {contacts.map((contact) => (
              <ClientCard key={contact._id} contact={contact} onClick={onSelectContact} />
            ))}
          </div>

          {/* Load more sentinel */}
          <div ref={sentinelRef} />
          {status === "LoadingMore" && (
            <div className="flex items-center gap-4 px-5 py-3.5 border-t border-border animate-pulse">
              <div className="w-9 h-9 rounded-xl bg-border shrink-0" />
              <div className="flex-1">
                <div className="h-3.5 bg-border rounded w-32 mb-2" />
                <div className="h-3 bg-background-sidebar rounded w-48" />
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && <NewClientModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
