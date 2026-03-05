import { Briefcase, User, Shield, Zap } from "lucide-react";

type View = "recruiter" | "candidate" | "admin";

const NavBar = ({ active, onNavigate }: { active: View; onNavigate: (v: View) => void }) => {
  const tabs: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: "recruiter", label: "Recruiter", icon: <Briefcase className="h-4 w-4" /> },
    { id: "candidate", label: "Candidate", icon: <User className="h-4 w-4" /> },
    { id: "admin", label: "Admin", icon: <Shield className="h-4 w-4" /> },
  ];

  return (
    <nav className="border-b border-border/50 bg-card/40 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-16">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <span className="font-bold text-lg tracking-tight">Signal</span>
          <span className="text-xs text-muted-foreground font-medium ml-1 hidden sm:inline">AI Hiring Companion</span>
        </div>
        <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                active === tab.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
