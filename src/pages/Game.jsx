import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, Music, Users, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AudioPlayer from "../components/AudioPlayer";
import SongReveal from "../components/SongReveal";
import ParticleBackground from "../components/ParticleBackground";
import SpotifyConnect from "../components/SpotifyConnect";
import GenreSelect from "../components/GenreSelect";
import PlayerSetup from "../components/PlayerSetup";
import TeamSetup from "../components/TeamSetup";
import ScoreAssign from "../components/ScoreAssign";
import { getRandomSong } from "../lib/songData";
import {
  isConnected,
  searchTrackPreview,
  searchPublicPreviewClip,
  resolvePreviewClipForLocalSong,
  disconnectSpotify,
  getUserPlaylists,
  getRandomTrackFromPlaylist,
  getUserTopTracksPool,
} from "../lib/spotify";

import { incrementGamesPlayed } from "../lib/unlocks";

export default function Game() {
  const navigate = useNavigate();
  const [connected, setConnected] = useState(true);
  const [playMode, setPlayMode] = useState("preview");
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
  const [selectedGenre, setSelectedGenre] = useState(null);

  // --- Player / team setup state ---
  const [setupStep, setSetupStep] = useState(null);   // "players" | "teams" | null
  const [setupComplete, setSetupComplete] = useState(false);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);             // [{ name, players }]
  const [maxSongsPerTeam, setMaxSongsPerTeam] = useState(10);
  const [teamPlayOrder, setTeamPlayOrder] = useState([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [scores, setScores] = useState({});  // { teamName: number }
  const [hasGameplayStarted, setHasGameplayStarted] = useState(false);
  const [showLeaveConfirmModal, setShowLeaveConfirmModal] = useState(false);
  const loadIdRef = useRef(0);

  const currentTeam = teams.length > 0 && teamPlayOrder.length > 0
    ? teams[teamPlayOrder[currentTurnIndex % teamPlayOrder.length]]
    : null;
  const totalGameSongs = teams.length > 0 ? teams.length * maxSongsPerTeam : 0;

  function generatePlayOrder(teamCount, maxSongs) {
    const shuffledIndices = Array.from({ length: teamCount }, (_, i) => i);
    for (let i = shuffledIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
    }

    const order = [];
    for (let round = 0; round < maxSongs; round++) {
      order.push(...shuffledIndices);
    }
    return order;
  }

  const canPlayPremiumFromTop = playMode === "premium" && connected && premiumSource === "top" && topTracksPool.length > 0;
  const canPlayPremiumFromPlaylist = playMode === "premium" && connected && premiumSource === "playlists" && !!selectedSpotifyPlaylistId;
  const shouldLoadPremiumSong = (canPlayPremiumFromTop || canPlayPremiumFromPlaylist) && setupComplete && phase === "playing";
  const shouldLoadPreviewSong = playMode === "preview" && connected && selectedGenre !== null && setupComplete && phase === "playing";

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
    const thisLoadId = ++loadIdRef.current;
    setIsLoading(true);
    setPhase("playing");
    setAudioUrl(null);
    setNoPreview(false);

    try {
      if (playMode === "preview") {
        const { song, index } = await getRandomSong(playedIndices, selectedGenre);
        if (loadIdRef.current !== thisLoadId) return;
        setCurrentSong(song);
        setPlayedIndices((prev) => [...prev, index]);

        const url = await resolvePreviewClipForLocalSong(song);
        if (loadIdRef.current !== thisLoadId) return;
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

        if (loadIdRef.current !== thisLoadId) return;

        if (!randomTrack) {
          setCurrentSong(null);
          setAudioUrl("");
          if (premiumSource === "playlists") {
            setPlaylistError("No playable tracks found in this playlist. Try another playlist.");
            setNoPreview(false);
          } else {
            setNoPreview(true);
          }
        } else {
          setPlaylistError("");
          const fallbackUrl = randomTrack.previewUrl
            || await searchPublicPreviewClip(randomTrack.song.title, randomTrack.song.artist);

          if (loadIdRef.current !== thisLoadId) return;

          setCurrentSong(randomTrack.song);
          setAudioUrl(fallbackUrl || "");
          setNoPreview(!fallbackUrl);
          if (randomTrack.trackId) {
            setPlayedTrackIds((prev) => [...prev, randomTrack.trackId]);
          }
        }
      } else {
        const { song, index } = await getRandomSong(playedIndices, selectedGenre);
        if (loadIdRef.current !== thisLoadId) return;
        setCurrentSong(song);
        setPlayedIndices((prev) => [...prev, index]);
        const url = await searchTrackPreview(song.title, song.artist);
        if (loadIdRef.current !== thisLoadId) return;
        setAudioUrl(url || "");
        setNoPreview(!url);
      }
    } finally {
      if (loadIdRef.current === thisLoadId) {
        setIsLoading(false);
      }
    }
  }, [playMode, premiumSource, topTracksPool, pickRandomFromPool, playedIndices, selectedSpotifyPlaylistId, playedTrackIds, selectedGenre]);

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

  useEffect(() => {
    if (!(setupComplete && phase === "intro" && currentTeam)) return;

    const timeoutId = window.setTimeout(() => {
      setPhase("playing");
    }, 4500);

    return () => window.clearTimeout(timeoutId);
  }, [setupComplete, phase, currentTeam]);

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

  // Show player setup once the content source is determined
  useEffect(() => {
    if (connected && playMode === "premium" && setupStep === null && !setupComplete) {
      setSetupStep("players");
    }
  }, [connected, playMode]);

  const handleTimeUp = () => {
    setSongsPlayed(prev => prev + 1);
    setPhase("reveal");
  };

  const handleNextSong = () => {
    if (teams.length > 0) {
      const nextTurn = currentTurnIndex + 1;
      if (nextTurn >= teamPlayOrder.length) {
        incrementGamesPlayed();
        setPhase("finished");
        return;
      }
      setCurrentTurnIndex(nextTurn);
    }
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
    setSelectedGenre(null);
    setSetupStep(null);
    setSetupComplete(false);
    setPhase("playing");
    setPlayers([]);
    setTeams([]);
    setMaxSongsPerTeam(10);
    setTeamPlayOrder([]);
    setCurrentTurnIndex(0);
    setScores({});
    setHasGameplayStarted(false);
  };

  const handleBackPress = () => {
    const gameInProgress = setupComplete && hasGameplayStarted && phase !== "finished";
    if (gameInProgress) {
      setShowLeaveConfirmModal(true);
      return;
    }

    handleDisconnect();
    navigate("/", { replace: true });
  };

  const confirmLeaveGame = () => {
    setShowLeaveConfirmModal(false);
    handleDisconnect();
    navigate("/", { replace: true });
  };

  const handleUsePreviewMode = () => {
    setPlayMode("preview");
    setConnected(true);
  };

  const handleGenreSelect = (genreId) => {
    setSelectedGenre(genreId);
    setPlayedIndices([]);
    setSetupStep("players");
  };

  const handleContinueWithoutPlayers = () => {
    setSetupStep(null);
    setPhase("playing");
    setSetupComplete(true);
  };

  const handlePlayersNext = (playerNames) => {
    setPlayers(playerNames);
    setSetupStep("teams");
  };

  const handleTeamsStart = ({ teams: configuredTeams, maxSongsPerTeam: maxSongs }) => {
    const playOrder = generatePlayOrder(configuredTeams.length, maxSongs);
    setTeams(configuredTeams);
    setMaxSongsPerTeam(maxSongs);
    setTeamPlayOrder(playOrder);
    setCurrentTurnIndex(0);
    setScores(Object.fromEntries(configuredTeams.map((t) => [t.name, 0])));
    setSetupStep(null);
    setPhase(configuredTeams.length > 0 ? "intro" : "playing");
    setSetupComplete(true);
  };

  const handleAssignPoints = (pts) => {
    if (!currentTeam) return;
    setScores((prev) => ({
      ...prev,
      [currentTeam.name]: (prev[currentTeam.name] || 0) + pts,
    }));
  };

  const handleGoToScoring = () => {
    setPhase("scoring");
  };

  const handleScoreConfirm = (pts) => {
    handleAssignPoints(pts);
    handleNextSong();
  };

  const handleTeamsBack = () => {
    setSetupStep("players");
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
        <header className="relative flex items-center justify-between px-6 py-4">
          <div className="flex-1 flex justify-start z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackPress}
              className="rounded-full text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-0">
            <img src="./logoTRNS.png" alt="Logo" className="w-8 h-8" />
          </div>

          <div className="flex-1 flex items-center justify-end gap-2 z-10">
            {connected && setupComplete && (
              <div className="flex items-center gap-1.5 bg-card/50 backdrop-blur border border-border/50 rounded-full px-3 py-1.5">
                <span className="text-xs text-muted-foreground">Song</span>
                <span className="text-sm font-heading font-bold text-primary">{songsPlayed}{totalGameSongs > 0 ? ` / ${totalGameSongs}` : ""}</span>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 min-h-0 overflow-hidden flex items-center justify-center px-6 py-8">
          <AnimatePresence mode="wait">
            {!connected && (
              <motion.div key="connect" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-md mx-auto">
                <SpotifyConnect onUsePreview={handleUsePreviewMode} />
              </motion.div>
            )}

            {connected && playMode === "preview" && selectedGenre === null && !setupComplete && (
              <motion.div key="genre-select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-md mx-auto">
                <GenreSelect onSelect={handleGenreSelect} />
              </motion.div>
            )}

            {connected && setupStep === "players" && (
              <motion.div key="player-setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-md mx-auto h-full max-h-full">
                <PlayerSetup
                  onContinueWithoutPlayers={handleContinueWithoutPlayers}
                  onNext={handlePlayersNext}
                />
              </motion.div>
            )}

            {connected && setupStep === "teams" && (
              <motion.div key="team-setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-md mx-auto">
                <TeamSetup
                  players={players}
                  onStart={handleTeamsStart}
                  onBack={handleTeamsBack}
                />
              </motion.div>
            )}

            {connected && setupComplete && phase === "intro" && currentTeam && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={{ duration: 0.25 }}
                className="w-full max-w-md mx-auto text-center"
              >
                <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-primary" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-3">
                  First Up
                </p>
                <h2 className="font-heading text-3xl font-bold text-foreground mb-3">
                  {currentTeam.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Get ready...
                </p>
              </motion.div>
            )}

            {connected && setupComplete && phase === "playing" && (playMode === "premium" || selectedGenre !== null) && (
              <motion.div
                key="playing"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md mx-auto"
              >
                {currentTeam && (
                  <div className="text-center mb-4">
                    <span className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 text-sm font-medium text-primary">
                      <Users className="w-4 h-4" />
                      {currentTeam.name.endsWith("'s Team") ? currentTeam.name : `${currentTeam.name}'s`} turn
                    </span>
                  </div>
                )}

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
                    <p className="text-sm font-medium text-foreground mb-2">Your Top Songs</p>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="text-xs text-muted-foreground">
                        Loaded: {topTracksPool.length}
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

                    {topTracksError && (
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
                  currentSong={currentSong}
                  onPlaybackStart={() => setHasGameplayStarted(true)}
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

            {connected && setupComplete && phase === "reveal" && currentSong && (
              <motion.div
                key="reveal"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md mx-auto"
              >
                {currentTeam && (
                  <div className="text-center mb-4">
                    <span className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 text-sm font-medium text-primary">
                      <Users className="w-4 h-4" />
                      {currentTeam.name}
                    </span>
                  </div>
                )}
                <SongReveal
                  song={currentSong}
                  onNextSong={handleNextSong}
                  hasTeams={teams.length > 0}
                  onGoToScoring={handleGoToScoring}
                />
              </motion.div>
            )}

            {connected && setupComplete && phase === "scoring" && currentSong && currentTeam && (
              <motion.div
                key={`scoring-wrapper-${songsPlayed}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-md mx-auto"
              >
                <ScoreAssign
                  key={`scoring-${songsPlayed}`}
                  song={currentSong}
                  teamName={currentTeam.name}
                  onConfirm={handleScoreConfirm}
                />
              </motion.div>
            )}

            {connected && setupComplete && phase === "finished" && (() => {
              const sorted = [...teams]
                .map((t) => ({ ...t, score: scores[t.name] || 0 }))
                .sort((a, b) => b.score - a.score);
              const topScore = sorted[0]?.score ?? 0;
              const winners = sorted.filter((t) => t.score === topScore);
              const isTie = winners.length > 1;
              return (
                <motion.div
                  key="finished"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="w-full max-w-md mx-auto text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-6">
                    <Trophy className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="font-heading text-3xl font-bold text-foreground mb-2">
                    {isTie ? "It's a tie!" : `${winners[0].name} wins!`}
                  </h2>
                  <p className="text-muted-foreground mb-8">
                    {totalGameSongs} songs played &middot; {topScore} point{topScore !== 1 ? "s" : ""}
                  </p>

                  {/* Scoreboard */}
                  <div className="flex flex-col gap-3 mb-8">
                    {sorted.map((team, i) => {
                      const isWinner = team.score === topScore;
                      return (
                        <div
                          key={team.name}
                          className={`flex items-center justify-between rounded-xl border px-5 py-4 ${
                            isWinner
                              ? "border-primary bg-primary/10"
                              : "border-border/50 bg-card/40"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`text-lg font-bold ${
                              isWinner ? "text-primary" : "text-muted-foreground"
                            }`}>
                              {i + 1}
                            </span>
                            <div className="text-left">
                              <p className={`text-sm font-semibold ${
                                isWinner ? "text-primary" : "text-foreground"
                              }`}>
                                {team.name}{isWinner && " 🏆"}
                              </p>
                              <p className="text-xs text-muted-foreground">{team.players.join(", ")}</p>
                            </div>
                          </div>
                          <span className={`text-xl font-heading font-bold ${
                            isWinner ? "text-primary" : "text-foreground"
                          }`}>
                            {team.score}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    onClick={() => {
                      handleDisconnect();
                      navigate("/", { replace: true });
                    }}
                    className="h-14 px-8 rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all font-heading font-semibold text-lg"
                  >
                    Back to Home
                  </Button>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showLeaveConfirmModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-6"
            >
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowLeaveConfirmModal(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ duration: 0.2 }}
                className="relative w-full max-w-sm rounded-2xl border border-border bg-card/95 backdrop-blur p-5"
              >
                <h3 className="font-heading text-xl font-bold text-foreground mb-2">Abandon current game?</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  All current progress and scores will be lost.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-full"
                    onClick={() => setShowLeaveConfirmModal(false)}
                  >
                    Continue game
                  </Button>
                  <Button
                    className="flex-1 rounded-full bg-destructive hover:opacity-90"
                    onClick={confirmLeaveGame}
                  >
                    Leave game
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}