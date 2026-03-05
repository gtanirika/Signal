import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ParsedJD {
  role: string;
  seniority: string;
  skills: string[];
  domain: string;
  responsibilities: string[];
}

export interface Question {
  id: string;
  text: string;
  type: string;
  order_index: number;
}

export interface Candidate {
  id: string;
  name: string;
  email?: string;
  score: number;
  status: string;
  ai_analysis: string;
  strengths: string[];
  recommendation: string;
  submitted_at: string;
  time_taken_seconds?: number;
}

interface AppState {
  // JD state
  currentJdId: string | null;
  setCurrentJdId: (id: string | null) => void;
  parsedJD: ParsedJD | null;
  setParsedJD: (p: ParsedJD | null) => void;
  jobDescription: string;
  setJobDescription: (jd: string) => void;

  // Questions
  questions: Question[];
  setQuestions: (q: Question[]) => void;

  // Candidates
  candidates: Candidate[];
  refreshCandidates: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentJdId, setCurrentJdId] = useState<string | null>(null);
  const [parsedJD, setParsedJD] = useState<ParsedJD | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  const refreshCandidates = async () => {
    if (!currentJdId) return;
    const { data } = await supabase
      .from("candidates")
      .select("*")
      .eq("jd_id", currentJdId)
      .order("score", { ascending: false });
    if (data) {
      setCandidates(data.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email || undefined,
        score: c.score || 0,
        status: c.status || "Reviewing",
        ai_analysis: c.ai_analysis || "",
        strengths: c.strengths || [],
        recommendation: c.recommendation || "",
        submitted_at: c.submitted_at,
        time_taken_seconds: c.time_taken_seconds || undefined,
      })));
    }
  };

  useEffect(() => {
    if (currentJdId) {
      refreshCandidates();
    }
  }, [currentJdId]);

  return (
    <AppContext.Provider value={{
      currentJdId, setCurrentJdId,
      parsedJD, setParsedJD,
      jobDescription, setJobDescription,
      questions, setQuestions,
      candidates, refreshCandidates,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppState = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used within AppProvider");
  return ctx;
};
