import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppSettings } from "@/lib/appSettings";

function Toggle({ checked, onChange, label, help }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full flex items-center gap-3 rounded-xl border border-border/60 bg-card/70 p-3 text-left hover:border-primary/40 transition-colors"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {help && <p className="text-xs text-muted-foreground mt-0.5">{help}</p>}
      </div>
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </span>
    </button>
  );
}

export default function GlobalSettings() {
  const [open, setOpen] = useState(false);
  const {
    volume,
    muted,
    language,
    cachePlayedSongs,
    setVolume,
    setMuted,
    setLanguage,
    setCachePlayedSongs,
    t,
  } = useAppSettings();

  return (
    <div className="fixed top-4 right-4 z-[60]">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full bg-card/80 backdrop-blur border-border/60 shadow-lg"
        aria-label={t("settings")}
      >
        <Settings className="w-5 h-5" />
      </Button>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              aria-label="Close settings overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 -z-10 bg-black/35"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="fixed top-28 right-4 w-[20rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-border/60 bg-card/95 backdrop-blur p-4 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading text-lg font-bold text-foreground">{t("settings")}</h3>
                <button
                  onClick={() => setOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-border/60 bg-card/70 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">{t("volume")}</p>
                    <button
                      onClick={() => setMuted(!muted)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={muted ? "Unmute" : "Mute"}
                    >
                      {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(volume * 100)}
                    onChange={(e) => {
                      const next = Number(e.target.value) / 100;
                      setVolume(next);
                      if (next > 0 && muted) setMuted(false);
                    }}
                    className="w-full accent-[hsl(var(--primary))]"
                  />
                </div>

                <div className="rounded-xl border border-border/60 bg-card/70 p-3">
                  <p className="text-sm font-medium text-foreground mb-2">{t("language")}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setLanguage("en")}
                      className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                        language === "en"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground hover:bg-muted/80"
                      }`}
                    >
                      {t("english")}
                    </button>
                    <button
                      onClick={() => setLanguage("nl")}
                      className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                        language === "nl"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground hover:bg-muted/80"
                      }`}
                    >
                      {t("dutch")}
                    </button>
                    <button
                      onClick={() => setLanguage("de")}
                      className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                        language === "de"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground hover:bg-muted/80"
                      }`}
                    >
                      {t("german")}
                    </button>
                    <button
                      onClick={() => setLanguage("es")}
                      className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                        language === "es"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground hover:bg-muted/80"
                      }`}
                    >
                      {t("spanish")}
                    </button>
                  </div>
                </div>

                <Toggle
                  checked={cachePlayedSongs}
                  onChange={setCachePlayedSongs}
                  label={t("savePlayedSongs")}
                  help={t("savePlayedSongsHelp")}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
