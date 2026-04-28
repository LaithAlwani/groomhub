import { useState, useEffect, Component } from "react";
import { AuthenticateWithRedirectCallback } from "@clerk/react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import LoginView from "./views/LoginView";
import SignUpView from "./views/SignUpView";
import CreateShopView from "./views/CreateShopView";
import SelectShopView from "./views/SelectShopView";
import DashboardView from "./views/DashboardView";
import ClientsView from "./views/ClientsView";
import ClientDetailView from "./views/ClientDetailView";
import AdminView from "./views/AdminView";
import PricesView from "./views/PricesView";

class ConvexErrorBoundary extends Component {
  state = { crashed: false };
  static getDerivedStateFromError() { return { crashed: true }; }
  render() {
    if (this.state.crashed) return <LoginView />;
    return this.props.children;
  }
}

function AppShell() {
  const { user, needsShop, needsShopSelection } = useAuth();
  const [page,              setPage]              = useState("dashboard");
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [showSignUp,        setShowSignUp]        = useState(false);

  useEffect(() => {
    setPage("dashboard");
    setSelectedContactId(null);
    setShowSignUp(false);
  }, [user?.userId, user?.shopId]);

  if (needsShopSelection) return <SelectShopView />;
  if (needsShop)          return <CreateShopView />;
  if (!user) {
    if (showSignUp) return <SignUpView />;
    return <LoginView />;
  }

  function handleNavigate(id) {
    setPage(id);
    setSelectedContactId(null);
  }

  function handleSelectContact(contact) {
    setSelectedContactId(contact._id);
    setPage("clients");
  }

  function renderPage() {
    if (page === "dashboard") return <DashboardView />;
    if (page === "clients") {
      if (selectedContactId) {
        return <ClientDetailView contactId={selectedContactId} onBack={() => setSelectedContactId(null)} />;
      }
      return <ClientsView onSelectContact={handleSelectContact} />;
    }
    if (page === "prices") return <PricesView />;
    if (page === "admin")  return user.isAdmin ? <AdminView /> : null;
    return (
      <div className="flex items-center justify-center h-64 text-text-muted">
        <p className="text-sm">Coming in a future phase</p>
      </div>
    );
  }

  return (
    <Layout page={page} onNavigate={handleNavigate}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  if (window.location.pathname === "/sso-callback") {
    return <AuthenticateWithRedirectCallback />;
  }

  return (
    <AuthProvider>
      <ConvexErrorBoundary>
        <AppShell />
      </ConvexErrorBoundary>
    </AuthProvider>
  );
}
