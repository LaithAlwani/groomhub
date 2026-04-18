import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, usePaginatedQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Icon from "../assets/Icon";
import ClientCard from "./ClientCard";
import NewClientModal from "./NewClientModal";

function isPhoneQuery(q) {
  // Matches digit-only strings (6138642922) or formatted numbers (613-864-2922)
  return /^\+?[\d\s\-\(\)]{4,}$/.test(q.trim());
}

export default function Clients({ searchQuery, onSelectContact }) {
  const [showModal,      setShowModal]      = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceRef  = useRef(null);
  const sentinelRef  = useRef(null);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(searchQuery ?? ""), 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  const isSearching = debouncedQuery.trim().length > 0;
  const phoneMode   = isPhoneQuery(debouncedQuery);

  const nameResults = useQuery(
    api.contacts.searchByName,
    isSearching && !phoneMode ? { query: debouncedQuery } : "skip",
  );

  const phoneResults = useQuery(
    api.contacts.searchByPhone,
    isSearching && phoneMode ? { query: debouncedQuery } : "skip",
  );

  const { results: pagedContacts, status, loadMore } = usePaginatedQuery(
    api.contacts.listContacts,
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

  // IntersectionObserver — fires loadMore when the sentinel div enters the viewport
  const handleIntersect = useCallback(
    (entries) => {
      if (entries[0].isIntersecting && canLoadMore) {
        loadMore(50);
      }
    },
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
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-title text-text-primary">Clients</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Manage your client list and their pets
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

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-background-card border border-border rounded-2xl p-4 animate-pulse">
              <div className="h-4 bg-border rounded w-3/4 mb-3" />
              <div className="h-3 bg-background-sidebar rounded w-1/2 mb-2" />
              <div className="h-3 bg-background-sidebar rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <Icon name="clients" className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No clients found</p>
          {isSearching && (
            <p className="text-xs mt-1">Try a different name or phone number</p>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map((contact) => (
              <ClientCard key={contact._id} contact={contact} onClick={onSelectContact} />
            ))}
          </div>

          {/* Sentinel — observed to trigger next page load */}
          <div ref={sentinelRef} className="h-8 mt-4" />

          {status === "LoadingMore" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-background-card border border-border rounded-2xl p-4 animate-pulse">
                  <div className="h-4 bg-border rounded w-3/4 mb-3" />
                  <div className="h-3 bg-background-sidebar rounded w-1/2 mb-2" />
                  <div className="h-3 bg-background-sidebar rounded w-2/3" />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showModal && <NewClientModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
