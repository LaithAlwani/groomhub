import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import Layout from "./components/Layout";
import Clients from "./components/Clients";
import ClientDetail from "./components/ClientDetail";
import Admin from "./components/Admin";

function AppShell() {
  const { user } = useAuth();
  const [page,              setPage]              = useState("clients");
  const [searchQuery,       setSearchQuery]       = useState("");
  const [selectedContactId, setSelectedContactId] = useState(null);

  if (!user) return <Login />;

  function handleNavigate(id) {
    setPage(id);
    setSearchQuery("");
    setSelectedContactId(null);
  }

  function handleSelectContact(contact) {
    setSelectedContactId(contact._id);
    setPage("clients"); // keep clients tab active
  }

  function handleBack() {
    setSelectedContactId(null);
  }

  function renderPage() {
    if (page === "clients") {
      if (selectedContactId) {
        return (
          <ClientDetail
            contactId={selectedContactId}
            onBack={handleBack}
          />
        );
      }
      return (
        <Clients
          searchQuery={searchQuery}
          onSelectContact={handleSelectContact}
        />
      );
    }

    if (page === "admin") {
      return user.isAdmin ? <Admin /> : null;
    }

    return (
      <div className="flex items-center justify-center h-64 text-text-muted">
        <p className="text-sm">Coming in a future phase</p>
      </div>
    );
  }

  return (
    <Layout
      page={page}
      onNavigate={handleNavigate}
      searchQuery={searchQuery}
      onSearch={setSearchQuery}
    >
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
