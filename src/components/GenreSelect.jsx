import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shuffle, List, Disc2, Zap, Flag, Lock, ArrowLeft, Check } from "lucide-react";
import { getPlaylists, getSongCount } from "../lib/songData";

const ICON_MAP = {
  oldies: Disc2,
  pop: Zap,
  dutch: Flag,
};

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    x: 30,
    transition: { duration: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: -20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

const MAX_LISTS = 5;

export default function GenreSelect({ onSelect }) {
  const [view, setView] = useState("main"); // "main" | "lists"
  const [availablePlaylists, setAvailablePlaylists] = useState([]);
  const [selected, setSelected] = useState([]);
  const [counts, setCounts] = useState({});
  const [isLoadingGenres, setIsLoadingGenres] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadGenreData() {
      try {
        const playlists = await getPlaylists();
        const mixCount = await getSongCount("mix");
        const playlistCounts = await Promise.all(
          playlists.map(async (p) => [p.id, await getSongCount(p.id)])
        );

        if (!active) return;
        setAvailablePlaylists(playlists);
        setCounts({ mix: mixCount, ...Object.fromEntries(playlistCounts) });
      } finally {
        if (active) setIsLoadingGenres(false);
      }
    }

    loadGenreData();
    return () => {
      active = false;
    };
  }, []);

  const topOptions = [
    {
      id: "mix",
      label: "Mix everything",
      description: "All genres shuffled together",
      songCount: counts.mix ?? 0,
      icon: Shuffle,
      disabled: false,
    },
    {
      id: "lists",
      label: "Select lists",
      description: "Choose your own playlists",
      icon: List,
      disabled: false,
    },
  ];

  const presetGenres = [
    ...availablePlaylists.map((p) => ({
      id: p.id,
      label: p.label,
      description: p.description,
      songCount: counts[p.id] ?? 0,
      icon: ICON_MAP[p.id] || Disc2,
      disabled: false,
    })),
    { id: "dutch", label: "Dutch hits", description: "Coming soon", icon: Flag, disabled: true },
  ];

  const togglePlaylist = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < MAX_LISTS ? [...prev, id] : prev
    );
  };

  const handleConfirmLists = () => {
    if (selected.length > 0) onSelect(selected);
  };

  const renderGenreButton = (genre) => {
    const IconComponent = genre.icon;
    return (
      <motion.button
        key={genre.id}
        variants={itemVariants}
        whileHover={!genre.disabled ? { scale: 1.02 } : {}}
        whileTap={!genre.disabled ? { scale: 0.98 } : {}}
        onClick={() => {
          if (genre.disabled) return;
          if (genre.id === "lists") {
            setView("lists");
          } else {
            onSelect(genre.id);
          }
        }}
        disabled={genre.disabled}
        className={`group relative flex items-center gap-4 w-full rounded-2xl border px-5 py-4 text-left transition-colors
          ${genre.disabled
            ? "border-border/50 bg-card/30 opacity-50 cursor-not-allowed"
            : "border-border bg-card/60 backdrop-blur hover:border-primary/40 hover:bg-card cursor-pointer"
          }`}
      >
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors
          ${genre.disabled
            ? "bg-muted/50 text-muted-foreground/50"
            : "bg-primary/10 text-primary group-hover:bg-primary/20"
          }`}
        >
          <IconComponent className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{genre.label}</p>
          <p className="text-xs text-muted-foreground">{genre.description}</p>
        </div>

        {typeof genre.songCount === "number" && !genre.disabled && (
          <span className="shrink-0 text-xs font-medium text-muted-foreground">
            {genre.songCount} songs
          </span>
        )}

        {genre.disabled && (
          <Lock className="w-4 h-4 text-muted-foreground/50 shrink-0" />
        )}
      </motion.button>
    );
  };

  if (view === "lists") {
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
            onClick={() => setView("main")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground">
              Select playlists
            </h2>
            <p className="text-sm text-muted-foreground">
              Pick up to {MAX_LISTS} ({selected.length}/{MAX_LISTS})
            </p>
          </div>
        </motion.div>

        <div className="flex flex-col gap-3">
          {availablePlaylists.map((pl) => {
            const isSelected = selected.includes(pl.id);
            const IconComponent = ICON_MAP[pl.id] || Disc2;
            return (
              <motion.button
                key={pl.id}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => togglePlaylist(pl.id)}
                className={`group relative flex items-center gap-4 w-full rounded-2xl border px-5 py-4 text-left transition-colors
                  ${isSelected
                    ? "border-primary bg-primary/10 backdrop-blur"
                    : "border-border bg-card/60 backdrop-blur hover:border-primary/40 hover:bg-card"
                  } cursor-pointer`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors
                  ${isSelected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary group-hover:bg-primary/20"}`}
                >
                  {isSelected ? <Check className="w-5 h-5" /> : <IconComponent className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{pl.label}</p>
                  <p className="text-xs text-muted-foreground">{pl.description}</p>
                </div>
                <span className="shrink-0 text-xs font-medium text-muted-foreground">
                  {counts[pl.id] ?? 0} songs
                </span>
              </motion.button>
            );
          })}
        </div>

        <motion.div variants={itemVariants} className="mt-6">
          <button
            onClick={handleConfirmLists}
            disabled={selected.length === 0}
            className={`w-full rounded-2xl px-5 py-4 font-semibold text-sm transition-colors
              ${selected.length > 0
                ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
          >
            Start with {selected.length} playlist{selected.length !== 1 ? "s" : ""}
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      className="w-full max-w-md mx-auto"
    >
      <motion.div variants={itemVariants} className="text-center mb-8">
        <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
          Pick a genre
        </h2>
        <p className="text-sm text-muted-foreground">
          What do you want to listen to?
        </p>
      </motion.div>

      {!isLoadingGenres && (
        <>
          <div className="flex flex-col gap-3">
            {topOptions.map(renderGenreButton)}
          </div>

          <motion.div variants={itemVariants} className="mt-7 mb-3 px-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Genres</p>
          </motion.div>

          <div className="flex flex-col gap-3">
            {presetGenres.map(renderGenreButton)}
          </div>
        </>
      )}

      {isLoadingGenres && (
        <motion.div variants={itemVariants} className="text-center py-8 text-sm text-muted-foreground">
          Loading genres...
        </motion.div>
      )}
    </motion.div>
  );
}
