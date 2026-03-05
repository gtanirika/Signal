import { useState, useEffect } from "react";
import { useAppState, Candidate } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Eye, Users, Clock, TrendingUp, Award } from "lucide-react";

const AdminView = () => {
  const { candidates, refreshCandidates, currentJdId, parsedJD } = useAppState();
  const [selected, setSelected] = useState<Candidate | null>(null);

  useEffect(() => {
    if (currentJdId) refreshCandidates();
  }, [currentJdId]);

  const statusColor = (status: string) => {
    switch (status) {
      case "Shortlisted": return "bg-signal/15 text-signal border-signal/30";
      case "Reviewing": return "bg-warning/15 text-warning border-warning/30";
      case "Rejected": return "bg-noise/15 text-noise border-noise/30";
      default: return "";
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-signal";
    if (score >= 70) return "text-warning";
    return "text-noise";
  };

  const formatTime = (s?: number) => {
    if (!s) return "—";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  if (candidates.length === 0) {
    return (
      <div className="max-w-2xl mx-auto animate-slide-up">
        <div className="glass rounded-xl p-12 text-center space-y-4">
          <Users className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-semibold">No Candidates Yet</h2>
          <p className="text-muted-foreground">Candidates will appear here once they submit their assessments.</p>
        </div>
      </div>
    );
  }

  const avgScore = Math.round(candidates.reduce((s, c) => s + c.score, 0) / candidates.length);
  const shortlisted = candidates.filter(c => c.status === "Shortlisted").length;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-slide-up">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 glow-primary">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Leaderboard</h1>
        </div>
        {parsedJD && (
          <p className="text-muted-foreground">Role: <span className="text-foreground font-medium">{parsedJD.role}</span> • {parsedJD.domain}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-xl p-5 text-center">
          <Users className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
          <p className="text-2xl font-bold">{candidates.length}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
        </div>
        <div className="glass rounded-xl p-5 text-center">
          <TrendingUp className="h-5 w-5 text-primary mx-auto mb-2" />
          <p className={`text-2xl font-bold font-mono ${scoreColor(avgScore)}`}>{avgScore}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg Score</p>
        </div>
        <div className="glass rounded-xl p-5 text-center">
          <Award className="h-5 w-5 text-signal mx-auto mb-2" />
          <p className="text-2xl font-bold text-signal">{shortlisted}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Shortlisted</p>
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">Rank</TableHead>
              <TableHead className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">Name</TableHead>
              <TableHead className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">AI Fit Score</TableHead>
              <TableHead className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">Time</TableHead>
              <TableHead className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">Status</TableHead>
              <TableHead className="text-muted-foreground font-semibold uppercase text-xs tracking-wider text-right">Analysis</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.map((c, i) => (
              <TableRow key={c.id} className="border-border/30 hover:bg-secondary/30 transition-colors">
                <TableCell className="font-mono text-muted-foreground">#{i + 1}</TableCell>
                <TableCell className="font-semibold">{c.name}</TableCell>
                <TableCell>
                  <span className={`font-mono font-bold text-lg ${scoreColor(c.score)}`}>{c.score}</span>
                </TableCell>
                <TableCell className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {formatTime(c.time_taken_seconds)}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor(c.status)}`}>
                    {c.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelected(c)}
                    className="border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    View Analysis
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="glass border-border/50 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              Signal vs Noise — {selected?.name}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-5 pt-2">
              <div className="flex items-center gap-4">
                <span className={`font-mono text-3xl font-bold ${scoreColor(selected.score)}`}>
                  {selected.score}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor(selected.status)}`}>
                  {selected.status}
                </span>
              </div>

              <div className="bg-background/50 rounded-lg p-4 border border-border/30">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">AI Analysis</p>
                <p className="text-sm leading-relaxed text-foreground">{selected.ai_analysis}</p>
              </div>

              {selected.strengths.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Key Strengths</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.strengths.map((s, i) => (
                      <span key={i} className="px-3 py-1 text-xs rounded-full bg-signal/10 text-signal border border-signal/20">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {selected.recommendation && (
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                  <p className="text-xs uppercase tracking-wider text-primary mb-1">Recommendation</p>
                  <p className="text-sm text-foreground">{selected.recommendation}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminView;
