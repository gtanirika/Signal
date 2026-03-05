import { useState } from "react";
import { AppProvider } from "@/context/AppContext";
import NavBar from "@/components/NavBar";
import RecruiterView from "@/components/RecruiterView";
import CandidateView from "@/components/CandidateView";
import AdminView from "@/components/AdminView";

type View = "recruiter" | "candidate" | "admin";

const Index = () => {
  const [view, setView] = useState<View>("recruiter");

  return (
    <AppProvider>
      <div className="min-h-screen bg-background">
        <NavBar active={view} onNavigate={setView} />
        <main className="px-6 py-10">
          {view === "recruiter" && <RecruiterView />}
          {view === "candidate" && <CandidateView />}
          {view === "admin" && <AdminView />}
        </main>
      </div>
    </AppProvider>
  );
};

export default Index;
