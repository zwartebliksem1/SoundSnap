import { createContext, useContext, useMemo, useState } from "react";
import { messages, formatMessage } from "./i18n";

const STORAGE_KEY = "soundsnap_settings";

const defaultSettings = {
  volume: 1,
  muted: false,
  language: "en",
  cachePlayedSongs: true,
};

const SUPPORTED_LANGUAGES = ["en", "nl", "de", "es"];

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw);
    return {
      ...defaultSettings,
      ...parsed,
      volume: Number.isFinite(parsed?.volume) ? Math.min(1, Math.max(0, parsed.volume)) : 1,
      muted: !!parsed?.muted,
      language: SUPPORTED_LANGUAGES.includes(parsed?.language) ? parsed.language : "en",
      cachePlayedSongs: parsed?.cachePlayedSongs !== false,
    };
  } catch {
    return defaultSettings;
  }
}

const AppSettingsContext = createContext(null);

export function AppSettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings);

  const updateSettings = (partial) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage failures silently.
      }
      return next;
    });
  };

  const t = useMemo(() => {
    return (key, vars) => {
      const locale = messages[settings.language] || messages.en;
      const template = locale[key] || messages.en[key] || key;
      return formatMessage(template, vars);
    };
  }, [settings.language]);

  const value = useMemo(
    () => ({
      ...settings,
      setVolume: (volume) => updateSettings({ volume: Math.min(1, Math.max(0, volume)) }),
      setMuted: (muted) => updateSettings({ muted: !!muted }),
      setLanguage: (language) => updateSettings({
        language: SUPPORTED_LANGUAGES.includes(language) ? language : "en",
      }),
      setCachePlayedSongs: (cachePlayedSongs) => updateSettings({ cachePlayedSongs: !!cachePlayedSongs }),
      t,
    }),
    [settings, t]
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) {
    throw new Error("useAppSettings must be used within AppSettingsProvider");
  }
  return ctx;
}
