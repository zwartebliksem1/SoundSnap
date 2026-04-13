import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Music, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AudioPlayer from "../components/AudioPlayer";
import SongReveal from "../components/SongReveal";
import ParticleBackground from "../components/ParticleBackground";
import SpotifyConnect from "../components/SpotifyConnect";
import { getRandomSong } from "../lib/songData";
import {
  isConnected,
  searchTrackPreview,
  searchPublicPreviewClip,
  disconnectSpotify,
  getUserPlaylists,
  getRandomTrackFromPlaylist,
  getUserTopTracksPool,
} from "../lib/spotify";

export default function Game() {
  const [connected, setConnected] = useState(isConnected());
  const [playMode, setPlayMode] = useState(isConnected() ? "premium" : null);
  const [phase, setPhase] = useState("playing");
  const [currentSong, setCurrentSong] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [songsPlayed, setSongsPlayed] = useState(0);
  const [playedIndices, setPlayedIndices] = useState([]);
  const [playedTrackIds, setPlayedTrackIds] = useState([]);
  const [noPreview, setNoPreview] = useState(false);
  const [premiumSource, setPremiumSource] = useState("top");
  const [spotifyPlaylists, setSpotifyPlaylists] = useState([]);
  const [selectedSpotifyPlaylistId, setSelectedSpotifyPlaylistId] = useState("");
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [playlistError, setPlaylistError] = useState("");
  const [topTracksPool, setTopTracksPool] = useState([]);
  const [isLoadingTopTracks, setIsLoadingTopTracks] = useState(false);
  const [topTracksError, setTopTracksError] = useState("");

  const canPlayPremiumFromTop = playMode === "premium" && connected && premiumSource === "top" && topTracksPool.length > 0;
  const canPlayPremiumFromPlaylist = playMode === "premium" && connected && premiumSource === "playlists" && !!selectedSpotifyPlaylistId;
  const shouldLoadPremiumSong = canPlayPremiumFromTop || canPlayPremiumFromPlaylist;
  const shouldLoadPreviewSong = playMode === "preview" && connected;

  const pickRandomFromPool = useCallback((pool, excludedIds = []) => {
    const available = pool.filter((item) => !excludedIds.includes(item.trackId));
    const source = available.length ? available : pool;
    if (!source.length) return null;
    return source[Math.floor(Math.random() * source.length)];
  }, []);

  const loadSpotifyPlaylists = useCallback(async () => {
    if (!(connected && playMode === "premium")) return;

    setIsLoadingPlaylists(true);
    setPlaylistError("");
    try {
      const playlists = await getUserPlaylists();
      setSpotifyPlaylists(playlists);

      if (!playlists.length) {
        setSelectedSpotifyPlaylistId("");
        setPlaylistError("No playlists found on this Spotify account.");
        return;
      }

      const stillValid = playlists.some((p) => p.id === selectedSpotifyPlaylistId);
      if (!stillValid) {
        setSelectedSpotifyPlaylistId(playlists[0].id);
      }
    } catch (error) {
      setSpotifyPlaylists([]);
      setSelectedSpotifyPlaylistId("");
      setPlaylistError(error?.message || "Could not load Spotify playlists.");
    } finally {
      setIsLoadingPlaylists(false);
    }
  }, [connected, playMode, selectedSpotifyPlaylistId]);

  const loadSong = useCallback(async (overridePlaylistId = null) => {
    setIsLoading(true);
    setPhase("playing");
    setAudioUrl(null);
    setNoPreview(false);

    try {
      if (playMode === "preview") {
        const { song, index } = getRandomSong(playedIndices);
        setCurrentSong(song);
        setPlayedIndices((prev) => [...prev, index]);

        const url = song.previewUrl || await searchPublicPreviewClip(song.title, song.artist);
        setAudioUrl(url || "");
        setNoPreview(!url);
      } else if (playMode === "premium") {
        let randomTrack = null;

        if (premiumSource === "top") {
          randomTrack = pickRandomFromPool(topTracksPool, playedTrackIds);
        } else {
          const playlistId = overridePlaylistId || selectedSpotifyPlaylistId;
          randomTrack = await getRandomTrackFromPlaylist(playlistId, playedTrackIds);
        }

        if (!randomTrack) {
          setCurrentSong(null);
          setAudioUrl("");
          setNoPreview(true);
        } else {
          const fallbackUrl = randomTrack.previewUrl
            || await searchPublicPreviewClip(randomTrack.song.title, randomTrack.song.artist);

          setCurrentSong(randomTrack.song);
          setAudioUrl(fallbackUrl || "");
          setNoPreview(!fallbackUrl);
          if (randomTrack.trackId) {
            setPlayedTrackIds((prev) => [...prev, randomTrack.trackId]);
          }
        }
      } else {
        const { song, index } = getRandomSong(playedIndices);
        setCurrentSong(song);
        setPlayedIndices((prev) => [...prev, index]);
        const url = await searchTrackPreview(song.title, song.artist);
        setAudioUrl(url || "");
        setNoPreview(!url);
      }
    } finally {
      setIsLoading(false);
    }
  }, [playMode, premiumSource, topTracksPool, pickRandomFromPool, playedIndices, selectedSpotifyPlaylistId, playedTrackIds]);

  useEffect(() => {
    if (shouldLoadPreviewSong) {
      loadSong();
    }
  }, [shouldLoadPreviewSong]);

  useEffect(() => {
    if (shouldLoadPremiumSong) {
      loadSong();
    }
  }, [shouldLoadPremiumSong, selectedSpotifyPlaylistId, premiumSource]);

  const loadTopTracks = useCallback(async () => {
    if (!(connected && playMode === "premium")) return;

    setIsLoadingTopTracks(true);
    setTopTracksError("");
    try {
      const pool = await getUserTopTracksPool();
      setTopTracksPool(pool);
      if (!pool.length) {
        setTopTracksError("No top tracks found for this Spotify account.");
      }
    } catch (error) {
      setTopTracksPool([]);
      setTopTracksError(error?.message || "Could not load your top songs.");
    } finally {
      setIsLoadingTopTracks(false);
    }
  }, [connected, playMode]);

  useEffect(() => {
    if (connected && playMode === "premium" && premiumSource === "playlists") {
      loadSpotifyPlaylists();
    }
  }, [connected, playMode, premiumSource, loadSpotifyPlaylists]);

  useEffect(() => {
    if (connected && playMode === "premium" && premiumSource === "top") {
      loadTopTracks();
    }
  }, [connected, playMode, premiumSource, loadTopTracks]);

  const handleTimeUp = () => {
    setSongsPlayed(prev => prev + 1);
    setPhase("reveal");
  };

  const handleNextSong = () => {
    loadSong();
  };

  const handleDisconnect = () => {
    if (playMode === "premium") {
      disconnectSpotify();
    }
    setConnected(false);
    setPlayMode(null);
    setCurrentSong(null);
    setAudioUrl(null);
    setPlayedIndices([]);
    setPlayedTrackIds([]);
    setPremiumSource("top");
    setSelectedSpotifyPlaylistId("");
    setSpotifyPlaylists([]);
    setPlaylistError("");
    setTopTracksPool([]);
    setTopTracksError("");
  };

  const handleUsePreviewMode = () => {
    setPlayMode("preview");
    setConnected(true);
  };

  const handlePlaylistChange = (playlistId) => {
    setSelectedSpotifyPlaylistId(playlistId);
    setPlayedTrackIds([]);
    loadSong(playlistId);
  };

  const handlePremiumSourceChange = (source) => {
    setPremiumSource(source);
    setPlayedTrackIds([]);
    setCurrentSong(null);
    setAudioUrl(null);
    setNoPreview(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />
      <div className="fixed inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5 pointer-events-none z-0" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-primary" />
            <span className="font-heading font-semibold text-sm text-foreground">SoundSnap</span>
          </div>
          <div className="flex items-center gap-2">
            {connected && (
              <>
                <div className="flex items-center gap-1.5 bg-card/50 backdrop-blur border border-border/50 rounded-full px-3 py-1.5">
                  <span className="text-xs text-muted-foreground">Played</span>
                  <span className="text-sm font-heading font-bold text-primary">{songsPlayed}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDisconnect}
                  className="rounded-full text-muted-foreground hover:text-foreground"
                  title="Disconnect Spotify"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <AnimatePresence mode="wait">
            {!connected && (
              <motion.div key="connect" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <SpotifyConnect onUsePreview={handleUsePreviewMode} />
              </motion.div>
            )}

            {connected && phase === "playing" && (
              <motion.div
                key="playing"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md mx-auto"
              >
                <div className="text-center mb-8">
                  <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
                    {isLoading ? "Finding a song..." : "Listen carefully..."}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {isLoading
                      ? playMode === "preview"
                        ? "Loading local preview clip"
                        : "Searching Spotify"
                      : "You have 30 seconds to listen"}
                  </p>
                </div>

                {playMode === "premium" && (
                  <div className="mb-4 text-left">
                    <div className="mb-3 grid grid-cols-2 gap-2">
                      <Button
                        variant={premiumSource === "top" ? "default" : "outline"}
                        className="h-9 rounded-full"
                        onClick={() => handlePremiumSourceChange("top")}
                      >
                        Top Songs
                      </Button>
                      <Button
                        variant={premiumSource === "playlists" ? "default" : "outline"}
                        className="h-9 rounded-full"
                        onClick={() => handlePremiumSourceChange("playlists")}
                      >
                        Playlists
                      </Button>
                    </div>

                    {premiumSource === "top" && (
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <p className="text-xs text-muted-foreground">
                          Loaded top songs: {topTracksPool.length}
                        </p>
                        <Button
                          variant="outline"
                          className="h-8 px-3 text-xs"
                          onClick={loadTopTracks}
                          disabled={isLoadingTopTracks}
                        >
                          Refresh
                        </Button>
                      </div>
                    )}

                    {premiumSource === "playlists" && (
                      <>
                    <label className="text-xs text-muted-foreground mb-1 block">Spotify Playlist</label>
                    <select
                      value={selectedSpotifyPlaylistId}
                      onChange={(e) => handlePlaylistChange(e.target.value)}
                      disabled={isLoadingPlaylists || !spotifyPlaylists.length}
                      className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                    >
                      {spotifyPlaylists.map((playlist) => (
                        <option key={playlist.id} value={playlist.id}>
                          {playlist.name} ({playlist.trackCount})
                        </option>
                      ))}
                    </select>

                    {playlistError && (
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="text-xs text-destructive">{playlistError}</p>
                        <Button
                          variant="outline"
                          className="h-8 px-3 text-xs"
                          onClick={loadSpotifyPlaylists}
                          disabled={isLoadingPlaylists}
                        >
                          Retry
                        </Button>
                      </div>
                    )}
                      </>
                    )}

                    {premiumSource === "top" && topTracksError && (
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="text-xs text-destructive">{topTracksError}</p>
                        <Button
                          variant="outline"
                          className="h-8 px-3 text-xs"
                          onClick={loadTopTracks}
                          disabled={isLoadingTopTracks}
                        >
                          Retry
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <AudioPlayer
                  audioUrl={audioUrl}
                  albumArt={currentSong?.albumArt}
                  onTimeUp={handleTimeUp}
                  isLoading={isLoading}
                />
                {!isLoading && noPreview && (
                  <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                      {playMode === "preview"
                        ? "No local Spotify preview clip is saved for this song."
                        : "No preview clip available in the selected playlist."}
                    </p>
                    <Button variant="outline" onClick={loadSong} className="rounded-full">
                      Try Another Song
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {connected && phase === "reveal" && currentSong && (
              <motion.div
                key="reveal"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <SongReveal
                  song={currentSong}
                  onNextSong={handleNextSong}
                  songsPlayed={songsPlayed}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}