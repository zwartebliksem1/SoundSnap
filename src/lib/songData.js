// Lazy-loaded song database fetched from public/data/songs.json.
// Songs are cached in memory after the first fetch.

let _cache = null;

async function loadData() {
  if (_cache) return _cache;
  const base = import.meta.env.BASE_URL || "/";
  const res = await fetch(`${base}data/songs.json`);
  const rawData = await res.json();

  // Allow snake_case (preview_url) in songs.json while keeping camelCase in app code.
  const normalizedSongs = (rawData.songs || []).map((song) => ({
    ...song,
    previewUrl: song.previewUrl || song.preview_url || null,
  }));

  _cache = {
    ...rawData,
    songs: normalizedSongs,
  };
  return _cache;
}

/**
 * Get the list of available playlists from the song data.
 * Returns [{ id, label, description }].
 */
export async function getPlaylists() {
  const data = await loadData();
  return data.playlists;
}

/**
 * Get a random song from the pool, filtered by playlist(s).
 *
 * @param {number[]} excludeIndices  - indices already played (into the filtered pool)
 * @param {string|string[]|null} playlists - playlist id(s) to filter by, or null/"mix" for all songs
 * @returns {Promise<{ song: object, index: number }>}
 */
export async function getRandomSong(excludeIndices = [], playlists = null) {
  const data = await loadData();
  let pool = data.songs;

  // Filter by playlist(s) — deduplicate automatically since we iterate the
  // flat songs array and a song appears only once even if tagged in multiple
  // selected playlists.
  if (playlists && playlists !== "mix") {
    const ids = Array.isArray(playlists) ? playlists : [playlists];
    pool = pool.filter((s) => s.playlists.some((p) => ids.includes(p)));
  }

  const available = pool
    .map((song, i) => ({ song, index: i }))
    .filter(({ index }) => !excludeIndices.includes(index));

  const source = available.length ? available : pool.map((song, i) => ({ song, index: i }));
  if (!source.length) return { song: pool[0], index: 0 };

  const pick = source[Math.floor(Math.random() * source.length)];
  return { song: pick.song, index: pick.index };
}

export async function getSongCount(playlists = null) {
  const data = await loadData();
  if (!playlists || playlists === "mix") return data.songs.length;
  const ids = Array.isArray(playlists) ? playlists : [playlists];
  return data.songs.filter((s) => s.playlists.some((p) => ids.includes(p))).length;
}