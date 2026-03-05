import { useState, useEffect, useRef } from "react";
import { useAppState } from "@/context/AppContext";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Send, AlertCircle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const CandidateView = () => {
  const { questions, currentJdId, jobDescription, refreshCandidates } = useAppState();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timer, setTimer] = useState(0);
  const [started, setStarted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setAnswers(questions.map(() => ""));
  }, [questions]);

  useEffect(() => {
    if (started && !submitted) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started, submitted]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const handleStart = () => {
    if (!name.trim()) {
      toast.error("Please enter your name first.");
      return;
    }
    setStarted(true);
  };

  const handleSubmit = async () => {
    if (answers.some(a => !a.trim())) {
      toast.error("Please answer all questions before submitting.");
      return;
    }
    if (!currentJdId) {
      toast.error("No assessment found. Please ask the recruiter to generate questions first.");
      return;
    }

    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      // Call AI scoring
      const { data: scoreData, error: scoreErr } = await supabase.functions.invoke("score-candidate", {
        body: {
          candidateName: name.trim(),
          questions: questions.map(q => q.text),
          answers,
          jobDescription,
        },
      });

      if (scoreErr) throw scoreErr;
      if (scoreData.error) throw new Error(scoreData.error);

      // Save candidate
      const { data: candidateRow, error: candErr } = await supabase.from("candidates").insert({
        name: name.trim(),
        email: email.trim() || null,
        jd_id: currentJdId,
        time_taken_seconds: timer,
        score: scoreData.overall_score,
        status: scoreData.status,
        ai_analysis: scoreData.analysis,
        strengths: scoreData.strengths,
        recommendation: scoreData.recommendation,
      }).select().single();

      if (candErr) throw candErr;

      // Save answers
      const answerRows = questions.map((q, i) => ({
        candidate_id: candidateRow.id,
        question_id: q.id,
        answer_text: answers[i],
        individual_score: scoreData.individual_scores?.[i]?.score || null,
        individual_feedback: scoreData.individual_scores?.[i]?.feedback || null,
      }));

      await supabase.from("candidate_answers").insert(answerRows);

      await refreshCandidates();
      setSubmitted(true);
      toast.success("Application submitted and scored by AI!");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto animate-slide-up">
        <div className="glass rounded-xl p-12 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-semibold">No Assessment Available</h2>
          <p className="text-muted-foreground">A recruiter hasn't generated questions yet. Please switch to the Recruiter tab first.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto animate-slide-up">
        <div className="glass rounded-xl p-12 text-center space-y-4 glow-signal">
          <CheckCircle2 className="h-16 w-16 text-signal mx-auto" />
          <h2 className="text-2xl font-bold">Application Submitted</h2>
          <p className="text-muted-foreground">
            Thank you, {name}. Your responses have been scored by AI in {formatTime(timer)}.
          </p>
          <p className="text-xs text-muted-foreground">Switch to the Admin tab to view your results.</p>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="max-w-2xl mx-auto animate-slide-up">
        <div className="space-y-2 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 glow-primary">
              <User className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Candidate Portal</h1>
          </div>
          <p className="text-muted-foreground">You'll answer {questions.length} scenario-based questions. A timer will start once you begin.</p>
        </div>

        <div className="glass rounded-xl p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Full Name *</label>
            <Input
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 bg-background/50 border-border/50 focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Email (optional)</label>
            <Input
              placeholder="you@email.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 bg-background/50 border-border/50 focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50"
            />
          </div>
          <Button
            onClick={handleStart}
            disabled={!name.trim()}
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Start Assessment
          </Button>
        </div>
      </div>
    );
  }

  const progress = answers.filter(a => a.trim().length > 0).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
      {/* Header with timer and progress */}
      <div className="flex items-center justify-between glass rounded-xl px-6 py-4 sticky top-20 z-40">
        <div>
          <p className="text-sm text-muted-foreground">Welcome, <span className="text-foreground font-medium">{name}</span></p>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-xs text-muted-foreground">{progress}/{questions.length} answered</span>
            <div className="w-32 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(progress / questions.length) * 100}%` }} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-primary font-mono text-lg">
          <Clock className="h-4 w-4" />
          {formatTime(timer)}
        </div>
      </div>

      {questions.map((q, i) => (
        <div key={q.id} className="glass rounded-xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <span className="shrink-0 mt-0.5 font-mono text-xs bg-primary/10 text-primary px-2 py-1 rounded">Q{i + 1}</span>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{q.type}</span>
              <p className="text-foreground leading-relaxed mt-1">{q.text}</p>
            </div>
          </div>
          <Textarea
            placeholder="Type your response... Be specific and structured."
            className="min-h-[120px] bg-background/50 border-border/50 focus:border-primary/50 resize-none text-foreground placeholder:text-muted-foreground/50"
            value={answers[i] || ""}
            onChange={(e) => {
              const newAnswers = [...answers];
              newAnswers[i] = e.target.value;
              setAnswers(newAnswers);
            }}
          />
        </div>
      ))}

      <Button
        onClick={handleSubmit}
        disabled={submitting || answers.some(a => !a.trim())}
        className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            AI is scoring your responses...
          </>
        ) : (
          <>
            <Send className="mr-2 h-5 w-5" />
            Submit Application
          </>
        )}
      </Button>
    </div>
  );
};

export default CandidateView;
