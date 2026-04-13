import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { exchangeCodeForToken } from "../lib/spotify";

export default function SpotifyCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const err = params.get("error");

    if (err) {
      setError("Spotify authorization was denied.");
      return;
    }

    if (code) {
      exchangeCodeForToken(code)
        .then(() => navigate("/play"))
        .catch(e => setError(e.message));
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-6">
        <div>
          <p className="text-destructive font-medium mb-4">{error}</p>
          <button onClick={() => navigate("/")} className="text-sm text-muted-foreground underline">
            Go back home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-muted border-t-[#1DB954] rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Connecting to Spotify...</p>
      </div>
    </div>
  );
}