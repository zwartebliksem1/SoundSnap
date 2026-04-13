import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ScoreAssign({ song, teamName, onConfirm }) {
  const [gotTitle, setGotTitle] = useState(false);
  const [gotArtist, setGotArtist] = useState(false);
  const [gotYear, setGotYear] = useState(false);

  const points = useMemo(() => {
    const titlePt = gotTitle ? 1 : 0;
    const artistPt = gotArtist ? 1 : 0;
    const bonus = gotTitle && gotArtist ? 1 : 0;
    const yearPt = gotYear ? 3 : 0;
    const total = titlePt + artistPt + bonus + yearPt;
    return { total };
  }, [gotTitle, gotArtist, gotYear]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center gap-6 w-full max-w-md mx-auto px-4"
    >
      {/* Team badge */}
      {teamName && (
        <div className="text-center">
          <span className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 text-sm font-medium text-primary">
            <Users className="w-4 h-4" />
            {teamName}
          </span>
        </div>
      )}

      {/* Song recap (compact) */}
      <div className="text-center">
        <h2 className="font-heading text-2xl font-bold text-foreground mb-1">
          Assign Points
        </h2>
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground font-medium">{song.title}</span>
          {" — "}
          <span className="text-primary">{song.artist}</span>
          {" ("}
          {song.year}
          {")"}
        </p>
      </div>

      {/* Toggles */}
      <div className="w-full space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-center">
          Tap what they guessed correctly
        </p>

        <ScoreToggle label="Title" sublabel="+1 point" active={gotTitle} onToggle={() => setGotTitle((v) => !v)} />
        <ScoreToggle label="Artist" sublabel="+1 point" active={gotArtist} onToggle={() => setGotArtist((v) => !v)} />

        {gotTitle && gotArtist && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="text-center text-xs text-primary font-medium"
          >
            +1 bonus for getting both!
          </motion.div>
        )}

        <ScoreToggle label="Year" sublabel="+3 points" active={gotYear} onToggle={() => setGotYear((v) => !v)} />
      </div>

      {/* Total */}
      <div className="text-center">
        <p className="text-lg font-heading font-bold text-foreground">
          Total: <span className="text-primary">{points.total}</span> point{points.total !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Confirm */}
      <Button
        onClick={() => onConfirm(points.total)}
        className="w-full h-14 text-lg font-heading font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity rounded-xl"
      >
        Confirm &amp; Next Song
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </motion.div>
  );
}

function ScoreToggle({ label, sublabel, active, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center justify-between w-full rounded-xl border px-5 py-4 transition-colors cursor-pointer ${
        active
          ? "border-primary bg-primary/10"
          : "border-border bg-card/60 backdrop-blur hover:border-primary/40"
      }`}
    >
      <div className="text-left">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      </div>
      {active && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="w-4 h-4" />
        </div>
      )}
    </button>
  );
}
