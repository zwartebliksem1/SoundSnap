import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Music2, ExternalLink } from "lucide-react";
import { initiateSpotifyLogin, hasClientId, getSpotifyRedirectUri } from "../lib/spotify";
import { useAppSettings } from "@/lib/appSettings";

export default function SpotifyConnect({ onUsePreview }) {
  const { t } = useAppSettings();
  const clientIdMissing = !hasClientId();
  const redirectUri = getSpotifyRedirectUri();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6 max-w-sm mx-auto text-center px-6"
    >
      <div className="w-20 h-20 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/30 flex items-center justify-center">
        <Music2 className="w-10 h-10 text-[#1DB954]" />
      </div>

      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
          {t("choosePlayMode")}
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {t("spotifyConnectDesc")}
        </p>
      </div>

      {!clientIdMissing && (
        <Button
          onClick={initiateSpotifyLogin}
          className="w-full h-12 rounded-full bg-[#1DB954] hover:bg-[#1aa34a] text-black font-semibold text-base transition-all"
        >
          {t("continueSpotifyPremium")}
        </Button>
      )}

      <Button
        variant="outline"
        onClick={onUsePreview}
        className="w-full h-12 rounded-full font-semibold text-base"
      >
        {t("useLocalPlaylists")}
      </Button>

      {clientIdMissing && (
        <div className="w-full bg-card border border-border rounded-xl p-4 text-left space-y-3">
          <p className="text-sm font-medium text-foreground">{t("premiumSetupRequired")}</p>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>
              {t("createSpotifyApp")}{" "}
              <a
                href="https://developer.spotify.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1DB954] underline underline-offset-2 inline-flex items-center gap-1"
              >
                developer.spotify.com <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>{t("addRedirectUri", { uri: redirectUri })}</li>
            <li>{t("copyClientId")}</li>
          </ol>
        </div>
      )}
    </motion.div>
  );
}