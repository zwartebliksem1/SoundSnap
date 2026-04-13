// Spotify OAuth PKCE flow + API helpers
// Set your Spotify App Client ID below (create one at https://developer.spotify.com/dashboard)
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || "";
const PRODUCTION_REDIRECT_URI = "https://zwartebliksem1.github.io/SoundSnap/";
const ENV_REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI?.trim();

function getDefaultRedirectUri() {
  if (import.meta.env.PROD) {
    return PRODUCTION_REDIRECT_URI;
  }

  return "https://localhost:4202/callback";
}

const REDIRECT_URI = import.meta.env.PROD ? PRODUCTION_REDIRECT_URI : (ENV_REDIRECT_URI || getDefaultRedirectUri());
const SCOPES = "streaming user-read-email user-read-private playlist-read-private playlist-read-collaborative user-top-read";
const CODE_VERIFIER_KEY = "spotify_code_verifier";
const OAUTH_STATE_KEY = "spotify_oauth_state";

export function getSpotifyRedirectUri() {
  return REDIRECT_URI;
}

function setPkceSession(codeVerifier, state) {
  sessionStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);
  sessionStorage.setItem(OAUTH_STATE_KEY, state);

  // Keep fallback values for browsers where sessionStorage may be unavailable.
  localStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);
  localStorage.setItem(OAUTH_STATE_KEY, state);
}

function getPkceSession() {
  const codeVerifier = sessionStorage.getItem(CODE_VERIFIER_KEY) || localStorage.getItem(CODE_VERIFIER_KEY);
  const state = sessionStorage.getItem(OAUTH_STATE_KEY) || localStorage.getItem(OAUTH_STATE_KEY);
  return { codeVerifier, state };
}

function clearPkceSession() {
  sessionStorage.removeItem(CODE_VERIFIER_KEY);
  sessionStorage.removeItem(OAUTH_STATE_KEY);
  localStorage.removeItem(CODE_VERIFIER_KEY);
  localStorage.removeItem(OAUTH_STATE_KEY);
}

// --- PKCE Helpers ---
function generateRandomString(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map(b => chars[b % chars.length])
    .join("");
}

async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest("SHA-256", data);
}

function base64urlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export async function initiateSpotifyLogin() {
  disconnectSpotify();

  const codeVerifier = generateRandomString(64);
  const state = generateRandomString(32);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64urlEncode(hashed);

  setPkceSession(codeVerifier, state);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    scope: SCOPES,
    show_dialog: "true",
    state,
    redirect_uri: REDIRECT_URI,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

export async function exchangeCodeForToken(code, returnedState) {
  const { codeVerifier, state } = getPkceSession();

  if (!codeVerifier) {
    throw new Error("Login session expired. Please reconnect Spotify.");
  }

  if (returnedState && state && returnedState !== state) {
    clearPkceSession();
    throw new Error("Spotify login session mismatch. Please reconnect Spotify.");
  }

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });
  const data = await res.json();
  if (data.access_token) {
    clearPkceSession();
    localStorage.setItem("spotify_access_token", data.access_token);
    localStorage.setItem("spotify_refresh_token", data.refresh_token || "");
    localStorage.setItem("spotify_token_expiry", Date.now() + data.expires_in * 1000);
    return data.access_token;
  }

  clearPkceSession();
  throw new Error(data.error_description || "Failed to exchange token");
}

export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("spotify_refresh_token");
  if (!refreshToken) return null;

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
    }),
  });
  const data = await res.json();
  if (data.access_token) {
    localStorage.setItem("spotify_access_token", data.access_token);
    localStorage.setItem("spotify_token_expiry", Date.now() + data.expires_in * 1000);
    return data.access_token;
  }
  return null;
}

export async function getAccessToken() {
  const token = localStorage.getItem("spotify_access_token");
  const expiry = parseInt(localStorage.getItem("spotify_token_expiry") || "0");
  if (token && Date.now() < expiry - 60000) return token;
  return await refreshAccessToken();
}

export function isConnected() {
  return !!localStorage.getItem("spotify_access_token");
}

export function disconnectSpotify() {
  localStorage.removeItem("spotify_access_token");
  localStorage.removeItem("spotify_refresh_token");
  localStorage.removeItem("spotify_token_expiry");
  clearPkceSession();
}

export async function searchTrackPreview(title, artist) {
  const token = await getAccessToken();
  if (!token) return null;

  const q = encodeURIComponent(`track:${title} artist:${artist}`);
  const res = await fetch(`https://api.spotify.com/v1/search?q=${q}&type=track&limit=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  const track = data.tracks?.items?.[0];
  return track?.preview_url || null;
}

export async function searchPublicPreviewClip(title, artist) {
  const query = encodeURIComponent(`${artist} ${title}`);
  const res = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=8`);
  const data = await res.json();
  const candidates = data.results || [];

  const normalizedTitle = title.toLowerCase();
  const normalizedArtist = artist.toLowerCase();
  const best = candidates.find((item) => {
    const trackName = (item.trackName || "").toLowerCase();
    const artistName = (item.artistName || "").toLowerCase();
    return trackName.includes(normalizedTitle.slice(0, 6)) || artistName.includes(normalizedArtist.slice(0, 6));
  });

  return best?.previewUrl || candidates[0]?.previewUrl || null;
}

export async function getUserPlaylists() {
  const token = await getAccessToken();
  if (!token) return [];

  let url = "https://api.spotify.com/v1/me/playlists?limit=50";
  const playlists = [];

  while (url) {
    const data = await spotifyGetJson(url, token);
    playlists.push(...(data.items || []));
    url = data.next;
  }

  const mapped = await Promise.all(
    playlists.map(async (playlist) => {
      let trackCount = playlist?.tracks?.total;

      if (trackCount == null && playlist?.id) {
        try {
          trackCount = await getPlaylistTrackTotal(playlist.id, token);
        } catch {
          trackCount = null;
        }
      }

      return {
        id: playlist.id,
        name: playlist.name,
        trackCount,
      };
    })
  );

  return mapped;
}

function pickTrackWithPreview(items, excludedIds = []) {
  const candidates = items
    .map((item) => item.track)
    .filter((track) => track && track.id && !excludedIds.includes(track.id));

  if (!candidates.length) return null;

  const withPreview = candidates.filter((track) => !!track.preview_url);
  const source = withPreview.length ? withPreview : candidates;
  return source[Math.floor(Math.random() * source.length)];
}

function mapTrackToSong(track) {
  const artist = (track.artists || []).map((a) => a.name).join(", ");
  const year = track.album?.release_date ? parseInt(track.album.release_date.slice(0, 4), 10) : "-";

  return {
    id: track.id,
    title: track.name,
    artist,
    album: track.album?.name || "Unknown album",
    albumArt: track.album?.images?.[0]?.url || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop",
    previewUrl: track.preview_url || null,
    year,
    genre: "Spotify Playlist",
  };
}

async function spotifyGetJson(url, token) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    let message = `Spotify API error (${res.status})`;
    try {
      const err = await res.json();
      message = err?.error?.message || message;
    } catch {
      // Keep default message.
    }
    throw new Error(message);
  }

  return res.json();
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function getPlaylistTrackTotal(playlistId, token) {
  const data = await spotifyGetJson(
    `https://api.spotify.com/v1/playlists/${playlistId}?fields=tracks(total)`,
    token
  );
  return data?.tracks?.total ?? 0;
}

export async function getUserTopTracksPool() {
  const token = await getAccessToken();
  if (!token) return [];

  const ranges = ["short_term", "medium_term", "long_term"];
  const requests = ranges.map((range) =>
    spotifyGetJson(`https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=${range}`, token)
  );

  const responses = await Promise.all(requests);
  const deduped = new Map();

  responses.forEach((response) => {
    (response.items || []).forEach((track) => {
      if (!track?.id || deduped.has(track.id)) return;
      deduped.set(track.id, {
        song: mapTrackToSong(track),
        previewUrl: track.preview_url || null,
        trackId: track.id,
      });
    });
  });

  return Array.from(deduped.values());
}

export async function getRandomTrackFromPlaylist(playlistId, excludedTrackIds = []) {
  const token = await getAccessToken();
  if (!token || !playlistId) return null;

  const headers = { Authorization: `Bearer ${token}` };
  const baseUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;

  const meta = await spotifyGetJson(`${baseUrl}?fields=total&limit=1`, token);
  const total = meta?.total || 0;
  if (!total) return null;

  const pageSize = 100;
  const offsets = [];
  for (let offset = 0; offset < total; offset += pageSize) {
    offsets.push(offset);
  }

  for (const offset of shuffle(offsets)) {
    const res = await fetch(
      `${baseUrl}?offset=${offset}&limit=${pageSize}&fields=items(track(id,name,preview_url,is_playable,artists(name),album(name,images,release_date))),total`,
      { headers }
    );

    if (!res.ok) {
      continue;
    }

    const data = await res.json();
    const track = pickTrackWithPreview(data.items || [], excludedTrackIds);

    if (track) {
      return {
        song: mapTrackToSong(track),
        previewUrl: track.preview_url || null,
        trackId: track.id,
      };
    }
  }

  return null;
}

export function hasClientId() {
  return !!CLIENT_ID;
}