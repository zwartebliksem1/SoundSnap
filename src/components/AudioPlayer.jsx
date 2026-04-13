import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import VinylDisc from "./VinylDisc";
import ProgressRing from "./ProgressRing";

const PLAY_DURATION = 30; // seconds
const RING_SIZE = 288;
const DISC_SIZE = 282;

export default function AudioPlayer({ audioUrl, albumArt, onTimeUp, isLoading }) {
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [finished, setFinished] = useState(false);

  const progress = (elapsed / PLAY_DURATION) * 100;
  const remaining = PLAY_DURATION - elapsed;

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
    stopTimer();
  }, [audioUrl, stopTimer]);

  const startPlayback = async () => {
    if (!audioUrl || isLoading) return;

    try {
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.currentTime = 0;
        audioRef.current.load();
        await audioRef.current.play();
        if (audioRef.current.currentTime > 0.25) {
          audioRef.current.currentTime = 0;
        }
      }

      setIsPlaying(true);
      setHasStarted(true);
      setElapsed(0);
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
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

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
        {hasStarted && !finished && (
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
            Time's up!
          </motion.div>
        )}
        {!hasStarted && !isLoading && (
          <p className="text-muted-foreground text-sm">Press play to start listening</p>
        )}
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
            <span className="text-sm">Loading song...</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {!finished ? (
          <>
            <Button
              size="lg"
              onClick={togglePlayback}
              disabled={isLoading || !audioUrl}
              className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent text-white hover:opacity-90 transition-all shadow-lg shadow-primary/30 disabled:opacity-60"
            >
              {hasStarted && isPlaying ? (
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

            {hasStarted && (
              <Button
                variant="outline"
                onClick={onTimeUp}
                className="h-12 px-5 rounded-full"
              >
                Reveal Now
              </Button>
            )}
          </>
        ) : (
          <Button
            size="lg"
            onClick={onTimeUp}
            className="h-14 px-8 rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all font-heading font-semibold text-lg shadow-lg shadow-primary/30"
          >
            Reveal Song
          </Button>
        )}

        {hasStarted && (
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
        )}
      </div>
    </div>
  );
}