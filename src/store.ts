export interface ContentItem {
  id: string;
  title: string;
  poster: string;
  backdrop?: string;
  link?: string;
  category?: string;
  genre?: string;
  year?: string;
  rating?: string;
  storyline?: string;
  cast?: { name: string; photo: string }[];
  trailer?: string;
  likes?: number;
  dislikes?: number;
  timestamp?: number;
  type: 'movie' | 'series';
  episodes?: any;
}

export interface LiveChannel {
  id: string;
  name: string;
  logoUrl: string;
  streamUrl: string;
  category: string;
  likes?: number;
  dislikes?: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  icon?: string;
  target?: string;
  targetEmails?: string[];
  movieId?: string;
  moviePoster?: string;
  timestamp?: number;
}

export interface AppState {
  allContent: ContentItem[];
  allLiveTvChannels: LiveChannel[];
  allCategories: string[];
  allNotifications: Notification[];
  watchlist: ContentItem[];
  recentSearches: string[];
  dismissedNotifications: string[];
  currentPage: string;
  navigationHistory: any[];
  currentTheme: string;
  currentMode: string;
  isAuthenticated: boolean;
  currentUser: any;
  isGuest: boolean;
  lastSeenNotifTimestamp: number;
  currentDetailItem: ContentItem | null;
  currentPlayerItem: ContentItem | null;
  currentLiveTvChannel: LiveChannel | null;
}

const defaultState: AppState = {
  allContent: [],
  allLiveTvChannels: [],
  allCategories: [],
  allNotifications: [],
  watchlist: [],
  recentSearches: [],
  dismissedNotifications: [],
  currentPage: 'home',
  navigationHistory: [],
  currentTheme: 'classic-red',
  currentMode: 'dark',
  isAuthenticated: false,
  currentUser: null,
  isGuest: false,
  lastSeenNotifTimestamp: 0,
  currentDetailItem: null,
  currentPlayerItem: null,
  currentLiveTvChannel: null,
};

type Listener = () => void;
const listeners: Set<Listener> = new Set();

let state: AppState = { ...defaultState };

export function getState(): AppState {
  return state;
}

export function setState(partial: Partial<AppState>) {
  state = { ...state, ...partial };
  listeners.forEach(fn => fn());
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// LocalStorage helpers
export function loadFromStorage() {
  try {
    const watchlist = localStorage.getItem('mh_watchlist');
    const recentSearches = localStorage.getItem('mh_recentSearches');
    const dismissed = localStorage.getItem('mh_dismissedNotifs');
    const theme = localStorage.getItem('mh_theme');
    const mode = localStorage.getItem('mh_mode');
    const lastSeen = localStorage.getItem('mh_lastSeenNotif');

    setState({
      watchlist: watchlist ? JSON.parse(watchlist) : [],
      recentSearches: recentSearches ? JSON.parse(recentSearches) : [],
      dismissedNotifications: dismissed ? JSON.parse(dismissed) : [],
      currentTheme: theme || 'classic-red',
      currentMode: mode || 'dark',
      lastSeenNotifTimestamp: lastSeen ? parseInt(lastSeen) : 0,
    });
  } catch {
    // ignore
  }
}

export function saveWatchlist(wl: ContentItem[]) {
  localStorage.setItem('mh_watchlist', JSON.stringify(wl));
  setState({ watchlist: wl });
}

export function saveRecentSearches(rs: string[]) {
  localStorage.setItem('mh_recentSearches', JSON.stringify(rs));
  setState({ recentSearches: rs });
}

export function saveDismissedNotifications(dn: string[]) {
  localStorage.setItem('mh_dismissedNotifs', JSON.stringify(dn));
  setState({ dismissedNotifications: dn });
}

export function saveTheme(theme: string) {
  localStorage.setItem('mh_theme', theme);
  setState({ currentTheme: theme });
}

export function saveMode(mode: string) {
  localStorage.setItem('mh_mode', mode);
  setState({ currentMode: mode });
}

export function saveLastSeenNotif(ts: number) {
  localStorage.setItem('mh_lastSeenNotif', ts.toString());
  setState({ lastSeenNotifTimestamp: ts });
}
