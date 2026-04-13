import { motion } from "framer-motion";
import { Music, Disc3, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SongReveal({ song, onNextSong, songsPlayed }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center gap-8 w-full max-w-md mx-auto px-4"
    >
      {/* Album Art */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative"
      >
        <div className="absolute -inset-4 bg-gradient-to-br from-primary/30 to-accent/30 rounded-2xl blur-2xl" />
        <img
          src={song.albumArt}
          alt={song.album}
          className="relative w-56 h-56 md:w-64 md:h-64 rounded-2xl object-cover shadow-2xl"
        />
      </motion.div>

      {/* Song Info */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center space-y-3"
      >
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
          {song.title}
        </h2>
        <p className="text-xl text-primary font-medium">{song.artist}</p>
      </motion.div>

      {/* Details */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-2 gap-4 w-full"
      >
        <DetailCard icon={Disc3} label="Album" value={song.album} />
        <DetailCard icon={Calendar} label="Year" value={song.year} />
        <DetailCard icon={Tag} label="Genre" value={song.genre} />
        <DetailCard icon={Music} label="Songs Played" value={songsPlayed} />
      </motion.div>

      {/* Next Song Button */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="w-full"
      >
        <Button
          onClick={onNextSong}
          className="w-full h-14 text-lg font-heading font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity rounded-xl"
        >
          Play Next Song
        </Button>
      </motion.div>
    </motion.div>
  );
}

function DetailCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-4 text-center">
      <Icon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-medium text-foreground truncate">{value}</p>
    </div>
  );
}