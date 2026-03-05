import { useState } from "react";
import { useAppState } from "@/context/AppContext";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Briefcase, Sparkles, Loader2, CheckCircle2, Brain, Target, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const RecruiterView = () => {
  const { jobDescription, setJobDescription, setQuestions, questions, setParsedJD, parsedJD, setCurrentJdId, currentJdId } = useAppState();
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = async () => {
    if (!jobDescription.trim()) return;
    setLoading(true);
    setGenerated(false);

    try {
      const { data, error } = await supabase.functions.invoke("generate-questions", {
        body: { jobDescription: jobDescription.trim() },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const { parsed, questions: generatedQuestions } = data;
      setParsedJD(parsed);

      // Save JD to database
      const { data: jdRow, error: jdErr } = await supabase.from("job_descriptions").insert({
        raw_text: jobDescription.trim(),
        title: parsed.role,
        parsed_role: parsed.role,
        parsed_seniority: parsed.seniority,
        parsed_skills: parsed.skills,
        parsed_domain: parsed.domain,
        parsed_responsibilities: parsed.responsibilities,
      }).select().single();

      if (jdErr) throw jdErr;
      setCurrentJdId(jdRow.id);

      // Save questions to database
      const questionRows = generatedQuestions.map((q: any, i: number) => ({
        jd_id: jdRow.id,
        question_text: q.text,
        question_type: q.type,
        order_index: i,
      }));

      const { data: savedQuestions, error: qErr } = await supabase
        .from("questions")
        .insert(questionRows)
        .select();

      if (qErr) throw qErr;

      setQuestions(savedQuestions.map(q => ({
        id: q.id,
        text: q.question_text,
        type: q.question_type || "scenario",
        order_index: q.order_index,
      })));

      setGenerated(true);
      toast.success(`${savedQuestions.length} questions generated for ${parsed.role}`);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to generate questions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-slide-up">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 glow-primary">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Recruiter Dashboard</h1>
        </div>
        <p className="text-muted-foreground">Paste any job description — our AI will parse it and generate judgment-based assessments in seconds.</p>
      </div>

      <div className="glass rounded-xl p-6 space-y-5">
        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Job Description</label>
        <Textarea
          placeholder="Paste the full job description here — from LinkedIn, Naukri, company careers page, etc."
          className="min-h-[200px] bg-background/50 border-border/50 focus:border-primary/50 resize-none text-foreground placeholder:text-muted-foreground/50"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />
        <Button
          onClick={handleGenerate}
          disabled={loading || !jobDescription.trim()}
          className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              AI is analyzing the JD...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Generate Assessment
            </>
          )}
        </Button>
      </div>

      {/* Parsed JD Card */}
      {parsedJD && generated && (
        <div className="glass rounded-xl p-6 space-y-4 animate-slide-up">
          <div className="flex items-center gap-2 text-primary">
            <Brain className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">JD Analysis</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-muted-foreground uppercase">Role</span>
              <p className="font-semibold">{parsedJD.role}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase">Seniority</span>
              <p className="font-semibold">{parsedJD.seniority}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase">Domain</span>
              <p className="font-semibold">{parsedJD.domain}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase">Skills</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {parsedJD.skills.slice(0, 6).map((s, i) => (
                  <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary border border-primary/20">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generated Questions */}
      {generated && questions.length > 0 && (
        <div className="space-y-4 animate-slide-up">
          <div className="flex items-center gap-2 text-signal">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">{questions.length} Questions Generated</span>
          </div>
          {questions.map((q, i) => (
            <div key={q.id} className="glass rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-primary">Q{i + 1}</span>
                <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-full bg-secondary text-muted-foreground">{q.type}</span>
              </div>
              <p className="text-foreground leading-relaxed">{q.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecruiterView;
