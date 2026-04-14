const KEY = "soundsnap_played_songs";

export function getPlayedSongIds() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function addPlayedSongId(id) {
  const current = getPlayedSongIds();
  if (!current.includes(id)) {
    localStorage.setItem(KEY, JSON.stringify([...current, id]));
  }
}

export function getPlayedSongCount() {
  return getPlayedSongIds().length;
}

export function clearPlayedSongs() {
  localStorage.removeItem(KEY);
}

/** Returns a stable string ID for a local song object. */
export function localSongId(song) {
  return `${song.title}|${song.artist}`;
}
