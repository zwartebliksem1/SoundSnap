import { motion } from "framer-motion";

export default function VinylDisc({ isPlaying, albumArt, size = 224 }) {
  const labelSize = Math.round(size * 0.32);
  const centerHoleSize = Math.max(8, Math.round(size * 0.04));
  const grooveSizes = [0.28, 0.42, 0.56, 0.7, 0.84].map((ratio) => Math.round(size * ratio));

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Outer vinyl */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-950 shadow-2xl"
        animate={{ rotate: isPlaying ? 360 : 0 }}
        transition={
          isPlaying
            ? { duration: 4, repeat: Infinity, ease: "linear" }
            : { duration: 0.3 }
        }
      >
        {/* Groove rings */}
        {grooveSizes.map((ringSize) => (
          <div
            key={ringSize}
            className="absolute rounded-full border border-neutral-700/40"
            style={{
              width: ringSize,
              height: ringSize,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}

        {/* Label / center */}
        <div
          className="absolute rounded-full overflow-hidden flex items-center justify-center"
          style={{
            width: labelSize,
            height: labelSize,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: albumArt
              ? undefined
              : "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
          }}
        >
          {albumArt ? (
            <img src={albumArt} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-neutral-950/80" />
          )}
        </div>

        {/* Center hole */}
        <div
          className="absolute rounded-full bg-neutral-950"
          style={{
            width: centerHoleSize,
            height: centerHoleSize,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      </motion.div>

      {/* Tonearm dot */}
      {isPlaying && (
        <motion.div
          className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-primary shadow-md shadow-primary/60"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </div>
  );
}
