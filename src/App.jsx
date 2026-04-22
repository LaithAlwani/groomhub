import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import LoginView from "./views/LoginView";
import DashboardView from "./views/DashboardView";
import ClientsView from "./views/ClientsView";
import ClientDetailView from "./views/ClientDetailView";
import AdminView from "./views/AdminView";

function AppShell() {
  const { user } = useAuth();
  const [page,              setPage]              = useState("dashboard");
  const [selectedContactId, setSelectedContactId] = useState(null);

  useEffect(() => {
    setPage("dashboard");
    setSelectedContactId(null);
  }, [user?.userId]);

  if (!user) return <LoginView />;

  function handleNavigate(id) {
    setPage(id);
    setSelectedContactId(null);
  }

  function handleSelectContact(contact) {
    setSelectedContactId(contact._id);
    setPage("clients");
  }

  function handleBack() {
    setSelectedContactId(null);
  }

  function renderPage() {
    if (page === "dashboard") {
      return <DashboardView />;
    }

    if (page === "clients") {
      if (selectedContactId) {
        return <ClientDetailView contactId={selectedContactId} onBack={handleBack} />;
      }
      return <ClientsView onSelectContact={handleSelectContact} />;
    }

    if (page === "admin") {
      return user.isAdmin ? <AdminView /> : null;
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
