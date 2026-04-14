import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Loader2, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import VinylDisc from "./VinylDisc";
import ProgressRing from "./ProgressRing";
import { useAppSettings } from "@/lib/appSettings";

const PLAY_DURATION = 30; // seconds
const RING_SIZE = 288;
const DISC_SIZE = 282;

export default function AudioPlayer({ audioUrl, albumArt, onTimeUp, isLoading, currentSong, onPlaybackStart, onDevNextSong }) {
  const { volume, muted, setMuted, t } = useAppSettings();
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const loadingTimeoutRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showLoadingIcon, setShowLoadingIcon] = useState(false);

  const progress = (elapsed / PLAY_DURATION) * 100;
  const remaining = PLAY_DURATION - elapsed;
  const isDevMode = import.meta.env.DEV || import.meta.env.VITE_ENV === "development";

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    stopTimer();
    setIsPlaying(false);
    setFinished(true);
  }, [stopTimer]);

  useEffect(() => {
    if (elapsed >= PLAY_DURATION) {
      stopPlayback();
    }
  }, [elapsed, stopPlayback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, [stopTimer]);

  // Reset when audioUrl changes
  useEffect(() => {
    setIsPlaying(false);
    setHasStarted(false);
    setElapsed(0);
    setFinished(false);
    setShowLoadingIcon(false);
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    stopTimer();
  }, [audioUrl, stopTimer]);

  // Show loading icon after 0.5 seconds of loading
  useEffect(() => {
    if (isLoading) {
      loadingTimeoutRef.current = setTimeout(() => {
        setShowLoadingIcon(true);
      }, 500);
    } else {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      setShowLoadingIcon(false);
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [isLoading]);

  // Keep the native audio element synced with global sound settings.
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
    audioRef.current.muted = muted || volume === 0;
  }, [volume, muted]);

  // Autoplay when a song URL is ready and loading is done
  useEffect(() => {
    if (!audioUrl || isLoading) return;
    startPlayback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl, isLoading]);

  const startPlayback = async () => {
    if (!audioUrl || isLoading) return;

    try {
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.currentTime = 0;
        audioRef.current.volume = volume;
        audioRef.current.muted = muted || volume === 0;
        audioRef.current.load();
        await new Promise(resolve => setTimeout(resolve, 100));
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
      }

      setIsPlaying(true);
      setHasStarted(true);
      setElapsed(0);
      onPlaybackStart?.();
      startTimer();
    } catch {
      setIsPlaying(false);
    }
  };

  const pausePlayback = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    stopTimer();
    setIsPlaying(false);
  };

  const resumePlayback = async () => {
    if (!audioRef.current || finished) return;
    try {
      await audioRef.current.play();
      setIsPlaying(true);
      startTimer();
    } catch {
      setIsPlaying(false);
    }
  };

  const togglePlayback = async () => {
    if (!hasStarted) {
      await startPlayback();
      return;
    }

    if (isPlaying) {
      pausePlayback();
    } else {
      await resumePlayback();
    }
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setIsMuted(next);
  };

  useEffect(() => {
    setIsMuted(muted || volume === 0);
  }, [muted, volume]);

  return (
    <div className="flex flex-col items-center gap-8">
      <audio ref={audioRef} preload="auto" />

      {/* Vinyl + Progress */}
      <div className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
        <ProgressRing progress={progress} size={RING_SIZE} />
        <div className="absolute inset-0 flex items-center justify-center">
          <VinylDisc isPlaying={isPlaying} albumArt={null} size={DISC_SIZE} />
        </div>
      </div>

      {/* Timer */}
      <div className="text-center">
        {import.meta.env.VITE_ENV === "development" && currentSong && (
          <div className="mb-4 text-sm font-medium text-amber-500 border border-amber-500/50 rounded-lg p-2 bg-amber-500/10">
            [DEV] {currentSong.title} - {currentSong.artist}
          </div>
        )}
        {!finished && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-heading text-5xl font-bold tabular-nums"
          >
            <span className="text-foreground">{remaining}</span>
            <span className="text-muted-foreground text-lg ml-1">s</span>
          </motion.div>
        )}
        {finished && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="font-heading text-2xl font-bold text-primary"
          >
            {t("timeUp")}
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center flex-row gap-4">
        {!finished ? (
          <>
            <Button
              size="lg"
              onClick={togglePlayback}
              disabled={isLoading || !audioUrl}
              className="relative h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent text-white hover:opacity-90 transition-all shadow-lg shadow-primary/30 disabled:opacity-60"
            >
              {showLoadingIcon ? (
                <Loader2
                  size={26}
                  className="text-white shrink-0 animate-spin"
                  style={{ minWidth: 26, minHeight: 26, display: "block" }}
                />
              ) : !hasStarted || isPlaying ? (
                <Pause
                  size={28}
                  className="text-white shrink-0"
                  style={{ minWidth: 28, minHeight: 28, display: "block" }}
                  strokeWidth={2.6}
                />
              ) : (
                <Play
                  size={28}
                  className="text-white shrink-0"
                  style={{ minWidth: 28, minHeight: 28, marginLeft: 2, display: "block" }}
                  fill="currentColor"
                  strokeWidth={2.2}
                />
              )}
            </Button>


              <Button
                variant="outline"
                onClick={onTimeUp}
                className="h-12 px-5 rounded-full"
                disabled={!hasStarted}
              >
                {t("revealNow")}
              </Button>
          </>
        ) : (
          <Button
            size="lg"
            onClick={onTimeUp}
            className="h-14 px-8 rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all font-heading font-semibold text-lg shadow-lg shadow-primary/30"
          >
            {t("revealSong")}
          </Button>
        )}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="rounded-full text-muted-foreground hover:text-foreground"
            >
              {isMuted ? (
                <VolumeX size={20} style={{ minWidth: 20, minHeight: 20, display: "block" }} />
              ) : (
                <Volume2 size={20} style={{ minWidth: 20, minHeight: 20, display: "block" }} />
              )}
            </Button>
          </motion.div>
        </div>

      {isDevMode && onDevNextSong && (
        <Button
          variant="outline"
          onClick={onDevNextSong}
          className="rounded-full h-10 px-4"
        >
          <SkipForward className="w-4 h-4 mr-2" />
          {t("devNextSong")}
        </Button>
      )}
    </div>
  );
}