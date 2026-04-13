import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { User, Shuffle, Wrench, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

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

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildAutoTeams(players, teamCount) {
  const shuffled = shuffle(players);
  const teams = Array.from({ length: teamCount }, (_, i) => ({
    name: `Team ${i + 1}`,
    players: [],
  }));
  shuffled.forEach((player, i) => {
    teams[i % teamCount].players.push(player);
  });
  return teams;
}

export default function TeamSetup({ players, onStart, onBack }) {
  const [mode, setMode] = useState("individual");
  const [maxSongs, setMaxSongs] = useState(10);
  const [customView, setCustomView] = useState(false);
  const [customTeamCount, setCustomTeamCount] = useState(2);
  const [assignments, setAssignments] = useState(() =>
    Object.fromEntries(players.map((p) => [p, 0]))
  );

  const autoTeamOptions = useMemo(() => {
    const options = [];
    for (let t = 2; t <= Math.floor(players.length / 2); t++) {
      options.push(t);
    }
    return options;
  }, [players.length]);

  const modeOptions = useMemo(() => {
    const opts = [
      { id: "individual", label: "Individual", description: "Each player plays alone", icon: User },
    ];
    autoTeamOptions.forEach((t) => {
      opts.push({
        id: `auto-${t}`,
        label: `${t} Teams`,
        description: `Randomly split into ${t} teams`,
        icon: Shuffle,
      });
    });
    opts.push({
      id: "custom",
      label: "Custom teams",
      description: "Sort players into teams yourself",
      icon: Wrench,
    });
    return opts;
  }, [autoTeamOptions]);

  const resolvedTeams = useMemo(() => {
    if (mode === "individual") {
      return players.map((p) => ({ name: p, players: [p] }));
    }
    if (mode.startsWith("auto-")) {
      const count = parseInt(mode.split("-")[1], 10);
      return buildAutoTeams(players, count);
    }
    if (mode === "custom") {
      const teams = Array.from({ length: customTeamCount }, (_, i) => ({
        name: `Team ${i + 1}`,
        players: [],
      }));
      players.forEach((p) => {
        const teamIdx = assignments[p] ?? 0;
        if (teamIdx < customTeamCount) {
          teams[teamIdx].players.push(p);
        }
      });
      return teams.filter((t) => t.players.length > 0);
    }
    return [];
  }, [mode, players, customTeamCount, assignments]);

  const cycleAssignment = (player) => {
    setAssignments((prev) => ({
      ...prev,
      [player]: ((prev[player] ?? 0) + 1) % customTeamCount,
    }));
  };

  const handleStart = () => {
    onStart({ teams: resolvedTeams, maxSongsPerTeam: maxSongs });
  };

  // Custom team assignment sub-view
  if (customView && mode === "custom") {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        exit="exit"
        className="w-full max-w-md mx-auto"
      >
        <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setCustomView(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">Assign teams</h2>
            <p className="text-xs text-muted-foreground">Tap the team to change assignment</p>
          </div>
        </motion.div>

        {/* Team count selector */}
        <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6">
          <span className="text-sm text-muted-foreground">Teams:</span>
          {[2, 3, 4, 5]
            .filter((n) => n <= players.length)
            .map((n) => (
              <button
                key={n}
                onClick={() => {
                  setCustomTeamCount(n);
                  setAssignments((prev) => {
                    const updated = { ...prev };
                    Object.keys(updated).forEach((k) => {
                      if (updated[k] >= n) updated[k] = 0;
                    });
                    return updated;
                  });
                }}
                className={`h-9 w-9 rounded-full text-sm font-semibold transition-colors ${
                  customTeamCount === n
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {n}
              </button>
            ))}
        </motion.div>

        {/* Player assignments */}
        <div className="flex flex-col gap-2 mb-6">
          {players.map((player) => (
            <motion.div
              key={player}
              variants={itemVariants}
              className="flex items-center justify-between rounded-xl border border-border bg-card/60 backdrop-blur px-4 py-3"
            >
              <span className="text-sm font-medium text-foreground">{player}</span>
              <button
                onClick={() => cycleAssignment(player)}
                className="h-8 min-w-[4rem] rounded-full bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors px-3"
              >
                Team {(assignments[player] ?? 0) + 1}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Preview */}
        <motion.div variants={itemVariants} className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Preview</p>
          <div className={`grid gap-3 ${resolvedTeams.length > 2 ? "grid-cols-3" : "grid-cols-2"}`}>
            {resolvedTeams.map((team) => (
              <div key={team.name} className="rounded-xl border border-border/50 bg-card/40 p-3">
                <p className="text-xs font-semibold text-primary mb-1">{team.name}</p>
                {team.players.map((p) => (
                  <p key={p} className="text-xs text-muted-foreground">{p}</p>
                ))}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Button
            onClick={handleStart}
            className="w-full h-12 rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all font-semibold text-base"
          >
            Start Game
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  // Main view
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      className="w-full max-w-md mx-auto"
    >
      <motion.div variants={itemVariants} className="flex items-center gap-3 mb-8">
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Teams</h2>
          <p className="text-sm text-muted-foreground">{players.length} player{players.length !== 1 ? "s" : ""}</p>
        </div>
      </motion.div>

      {/* Mode selection */}
      <div className="flex flex-col gap-3 mb-8">
        {modeOptions.map((opt) => {
          const Icon = opt.icon;
          const selected = mode === opt.id;
          return (
            <motion.button
              key={opt.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setMode(opt.id);
                if (opt.id === "custom") setCustomView(false);
              }}
              className={`group relative flex items-center gap-4 w-full rounded-2xl border px-5 py-4 text-left transition-colors cursor-pointer ${
                selected
                  ? "border-primary bg-primary/10 backdrop-blur"
                  : "border-border bg-card/60 backdrop-blur hover:border-primary/40 hover:bg-card"
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/10 text-primary group-hover:bg-primary/20"
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.description}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Max songs setting */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-foreground">
            Max songs per {mode === "individual" ? "player" : "team"}
          </p>
          <input
            type="number"
            value={maxSongs}
            onChange={(e) => setMaxSongs(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
            className="w-16 h-8 rounded-lg border border-border bg-card/60 text-center text-sm font-semibold text-foreground focus:outline-none focus:border-primary/40"
          />
        </div>
        <input
          type="range"
          min={1}
          max={50}
          value={maxSongs}
          onChange={(e) => setMaxSongs(parseInt(e.target.value))}
          className="w-full accent-[hsl(var(--primary))]"
        />
      </motion.div>

      {/* Team preview (non-custom modes) */}
      {mode !== "custom" && (
        <motion.div variants={itemVariants} className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Preview</p>
          <div className={`grid gap-3 ${resolvedTeams.length > 2 ? "grid-cols-3" : "grid-cols-2"}`}>
            {resolvedTeams.map((team) => (
              <div key={team.name} className="rounded-xl border border-border/50 bg-card/40 p-3">
                <p className="text-xs font-semibold text-primary mb-1">{team.name}</p>
                {team.players.map((p) => (
                  <p key={p} className="text-xs text-muted-foreground">{p}</p>
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div variants={itemVariants}>
        {mode === "custom" ? (
          <Button
            onClick={() => setCustomView(true)}
            className="w-full h-12 rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all font-semibold text-base"
          >
            Assign Players
          </Button>
        ) : (
          <Button
            onClick={handleStart}
            className="w-full h-12 rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all font-semibold text-base"
          >
            Start Game
          </Button>
        )}
      </motion.div>
    </motion.div>
  );
}
