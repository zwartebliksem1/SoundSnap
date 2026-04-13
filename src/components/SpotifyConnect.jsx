import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Music2, ExternalLink } from "lucide-react";
import { initiateSpotifyLogin, hasClientId, getSpotifyRedirectUri } from "../lib/spotify";

export default function SpotifyConnect({ onUsePreview }) {
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
          Choose Your Play Mode
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Continue with Spotify Premium to play your favorite tracks or use local playlists without signing in.
        </p>
      </div>

      {!clientIdMissing && (
        <Button
          onClick={initiateSpotifyLogin}
          className="w-full h-12 rounded-full bg-[#1DB954] hover:bg-[#1aa34a] text-black font-semibold text-base transition-all"
        >
          Continue with Spotify Premium
        </Button>
      )}

      <Button
        variant="outline"
        onClick={onUsePreview}
        className="w-full h-12 rounded-full font-semibold text-base"
      >
        Use Local Playlists
      </Button>

      {clientIdMissing && (
        <div className="w-full bg-card border border-border rounded-xl p-4 text-left space-y-3">
          <p className="text-sm font-medium text-foreground">Premium setup required:</p>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>
              Create a Spotify App at{" "}
              <a
                href="https://developer.spotify.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1DB954] underline underline-offset-2 inline-flex items-center gap-1"
              >
                developer.spotify.com <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>Add <code className="bg-muted px-1 py-0.5 rounded text-xs">{redirectUri}</code> as a Redirect URI</li>
            <li>Copy your Client ID and set it as <code className="bg-muted px-1 py-0.5 rounded text-xs">VITE_SPOTIFY_CLIENT_ID</code> in your environment</li>
          </ol>
        </div>
      )}
    </motion.div>
  );
}