import { useState } from "react";
import { useClientSearch } from "../hooks/useClientSearch";
import Icon from "../assets/Icon";
import ClientCard from "../components/ClientCard";
import NewClientModal from "../components/NewClientModal";

export default function ClientsView({ onSelectContact }) {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { contacts, isLoading, isSearching, status, sentinelRef } =
    useClientSearch(searchQuery);

  return (
    <div>
      <div className="flex items-center justify-start mb-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Clients</h1>
        </div>
        <div className="relative  w-3/4 ml-auto">
          <Icon
            name="search"
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search clients by name or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-3/4 lg:w-1/2 border border-border rounded-lg pl-9 pr-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary bg-background-card"
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors">
          <Icon name="plus" className="w-4 h-4" />
          New Client
        </button>
      </div>

      {isLoading ? (
        <div className="bg-background-card border border-border rounded-2xl shadow-card overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-0 animate-pulse">
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
          {isSearching ? (
            <p className="text-xs text-text-muted mt-1">Try a different name or phone number</p>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="mt-3 text-sm text-primary hover:text-primary-hover font-medium transition-colors">
              Add your first client
            </button>
          )}
        </div>
      ) : (
        <div className="bg-background-card border border-border rounded-2xl shadow-card overflow-hidden">
          <div className="flex items-center gap-4 px-5 py-2.5 border-b border-border bg-background-sidebar">
            <div className="w-9 shrink-0" />
            <div className="flex-1 text-xs font-medium text-text-muted uppercase tracking-widest">
              Name
            </div>
            <div className="hidden sm:block text-xs font-medium text-text-muted uppercase tracking-widest w-36 shrink-0">
              Phone
            </div>
            <div className="hidden md:block text-xs font-medium text-text-muted uppercase tracking-widest w-28 shrink-0">
              Last Visit
            </div>
            <div className="text-xs font-medium text-text-muted uppercase tracking-widest shrink-0">
              Pets
            </div>
            <div className="w-4 shrink-0" />
          </div>
          <div className="divide-y divide-border">
            {contacts.map((contact) => (
              <ClientCard key={contact._id} contact={contact} onClick={onSelectContact} />
            ))}
          </div>
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
