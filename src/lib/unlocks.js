
export const GAMES_PLAYED_KEY = "soundsnap_games_played";
export const PURCHASED_PLAYLISTS_KEY = "soundsnap_purchased_playlists";
export const TOKENS_SPENT_KEY = "soundsnap_tokens_spent";

export function getGamesPlayed() {
  try {
    return parseInt(localStorage.getItem(GAMES_PLAYED_KEY) || "0", 10);
  } catch {
    return 0;
  }
}

export function incrementGamesPlayed() {
  const current = getGamesPlayed();
  try {
    localStorage.setItem(GAMES_PLAYED_KEY, (current + 1).toString());
  } catch {}
  return current + 1;
}

export function getTokensSpent() {
  try {
    return parseInt(localStorage.getItem(TOKENS_SPENT_KEY) || "0", 10);
  } catch {
    return 0;
  }
}

export function getAvailableTokens() {
  const totalGames = getGamesPlayed();
  const spent = getTokensSpent();
  return Math.floor(totalGames / 50) - spent;
}

export function spendToken() {
  const spent = getTokensSpent();
  try {
    localStorage.setItem(TOKENS_SPENT_KEY, (spent + 1).toString());
  } catch {}
}

export function getPurchasedPlaylists() {
  try {
    return JSON.parse(localStorage.getItem(PURCHASED_PLAYLISTS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function unlockPlaylist(id) {
  const purchased = getPurchasedPlaylists();
  if (!purchased.includes(id)) {
    try {
      localStorage.setItem(PURCHASED_PLAYLISTS_KEY, JSON.stringify([...purchased, id]));
    } catch {}
  }
}

export function isUnlocked(playlistId) {
  const devMode = import.meta.env.VITE_ENV === "development";
  if (devMode) return true;

  const defaultPlaylists = ["hits", "oldies", "pop", "mix", "lists"];
  if (defaultPlaylists.includes(playlistId)) return true;

  const purchased = getPurchasedPlaylists();
  if (purchased.includes(playlistId)) return true;

  return true; // turn to false to remove paywall
}

