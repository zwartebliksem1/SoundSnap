import { motion } from "framer-motion";
import { Music, Headphones, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import ParticleBackground from "../components/ParticleBackground";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />

      {/* Gradient overlays */}
      <div className="fixed inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5 pointer-events-none z-0" />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        {/* Logo / Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="mb-8"
        >
          <img src="./logoTRNS.png" alt="SoundSnap Logo" className="w-24 h-24 md:w-32 md:h-32" />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-4"
        >
          <h1 className="text-5xl md:text-7xl font-heading font-bold text-foreground tracking-tight">
            Sound
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Snap
            </span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-lg md:text-xl text-muted-foreground text-center max-w-md mb-12 font-light"
        >
          Listen to a 30-second clip. Can you name the song?
        </motion.p>

        {/* Features */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex gap-8 mb-12"
        >
          <Feature icon={Headphones} text="Listen" />
          <Feature icon={Sparkles} text="Guess" />
          <Feature icon={Music} text="Discover" />
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <Link to="/play">
            <Button
              size="lg"
              className="h-16 px-12 text-lg font-heading font-semibold rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-xl shadow-primary/30 animate-pulse-glow"
            >
              Start Playing
            </Button>
          </Link>
        </motion.div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-16 text-xs text-muted-foreground/50"
        >
          Powered by Spotify
        </motion.p>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-12 h-12 rounded-xl bg-card border border-border/50 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{text}</span>
    </div>
  );
}