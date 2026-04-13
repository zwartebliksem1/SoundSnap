import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserPlus, X, Users, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "soundsnap_players";

function loadRememberedPlayers() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return null;
}

function saveRememberedPlayers(names) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
  } catch { /* ignore */ }
}

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
  exit: { opacity: 0, x: 30, transition: { duration: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: -20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function PlayerSetup({ onContinueWithoutPlayers, onNext }) {
  const [names, setNames] = useState([""]);
  const [remembered, setRemembered] = useState(null);

  useEffect(() => {
    const saved = loadRememberedPlayers();
    if (saved) setRemembered(saved);
  }, []);

  const useRemembered = () => {
    if (remembered) {
      setNames(remembered);
      setRemembered(null);
    }
  };

  const dismissRemembered = () => setRemembered(null);

  const updateName = (i, value) =>
    setNames((prev) => prev.map((n, idx) => (idx === i ? value : n)));

  const addRow = () => setNames((prev) => [...prev, ""]);

  const removeRow = (i) => setNames((prev) => prev.filter((_, idx) => idx !== i));

  const handleKeyDown = (e, i) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (i === names.length - 1) addRow();
    }
  };

  const validNames = names.map((n) => n.trim()).filter(Boolean);
  const hasPlayers = validNames.length > 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      className="w-full max-w-md mx-auto"
    >
      <motion.div variants={itemVariants} className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
          Add Players
        </h2>
        <p className="text-sm text-muted-foreground">
          Playing with friends? Add their names to keep score.
        </p>
      </motion.div>

      {/* Remembered players banner */}
      {remembered && (
        <motion.div
          variants={itemVariants}
          className="mb-4 rounded-xl border border-primary/30 bg-primary/5 backdrop-blur px-5 py-4"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-foreground">Previous players</p>
            <button
              onClick={dismissRemembered}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Dismiss
            </button>
          </div>
          <p className="text-xs text-muted-foreground mb-3">{remembered.join(", ")}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={useRemembered}
            className="rounded-full text-xs h-8"
          >
            <RotateCcw className="w-3 h-3 mr-1.5" />
            Use these players
          </Button>
        </motion.div>
      )}

      <div className="flex flex-col gap-3 mb-4">
        {names.map((name, i) => (
          <motion.div key={i} variants={itemVariants} className="flex items-center gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => updateName(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              placeholder="Add name"
              className="flex-1 h-12 rounded-xl border border-border bg-card/60 backdrop-blur px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-colors"
            />
            {names.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeRow(i)}
                className="rounded-full text-muted-foreground hover:text-destructive shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </motion.div>
        ))}
      </div>

      <motion.div variants={itemVariants}>
        <button
          onClick={addRow}
          className="flex items-center gap-2 w-full rounded-xl border border-dashed border-border hover:border-primary/40 px-5 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Add another player
        </button>
      </motion.div>

      <motion.div variants={itemVariants} className="mt-8 flex flex-col gap-3">
        {hasPlayers && (
          <Button
            onClick={() => {
              saveRememberedPlayers(validNames);
              onNext(validNames);
            }}
            className="w-full h-12 rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all font-semibold text-base"
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
        <Button
          variant="outline"
          onClick={onContinueWithoutPlayers}
          className="w-full h-12 rounded-full font-semibold text-base"
        >
          Continue without players
        </Button>
      </motion.div>
    </motion.div>
  );
}
