import { useState, useEffect, useCallback, useRef } from 'react';
import { initFirebase, getAuth, getDatabase, getFirebase } from './firebase';
import {
  getState, loadFromStorage, saveWatchlist, saveRecentSearches,
  saveDismissedNotifications, saveTheme, saveMode, saveLastSeenNotif,
  type ContentItem, type LiveChannel, type Notification as AppNotification,
} from './store';

// ============================================================
// MOVIEHUNT - Complete Streaming Application
// ============================================================

// Avatar URLs
const MALE_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Max&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Oscar&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Buddy&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Duke&backgroundColor=ffd5dc',
];
const FEMALE_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Lily&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucy&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Daisy&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Ruby&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Molly&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Chloe&backgroundColor=d1d4f9',
];
const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default&backgroundColor=b6e3f4';

// Demo content for when Firebase has no data
const DEMO_CONTENT: ContentItem[] = [
  { id: 'demo1', title: 'The Last Horizon', poster: 'https://picsum.photos/seed/movie1/300/450', backdrop: 'https://picsum.photos/seed/movie1bg/600/340', category: 'Action', year: '2024', rating: '8.5', storyline: 'A gripping tale of survival against impossible odds in a dystopian future where humanity must fight to reclaim Earth.', type: 'movie', likes: 245, dislikes: 12, link: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', cast: [{name: 'John Smith', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john'}, {name: 'Jane Doe', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane'}], timestamp: Date.now() },
  { id: 'demo2', title: 'Midnight Express', poster: 'https://picsum.photos/seed/movie2/300/450', backdrop: 'https://picsum.photos/seed/movie2bg/600/340', category: 'Thriller', year: '2024', rating: '7.9', storyline: 'An edge-of-your-seat thriller following an undercover agent trapped in a web of international espionage.', type: 'movie', likes: 189, dislikes: 8, link: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', timestamp: Date.now() - 100000 },
  { id: 'demo3', title: 'Love in Paris', poster: 'https://picsum.photos/seed/movie3/300/450', backdrop: 'https://picsum.photos/seed/movie3bg/600/340', category: 'Romance', year: '2023', rating: '7.2', storyline: 'Two strangers meet on a rainy evening in Paris and discover a love that transcends time.', type: 'movie', likes: 342, dislikes: 22, link: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', timestamp: Date.now() - 200000 },
  { id: 'demo4', title: 'Galaxy Wars: Rebirth', poster: 'https://picsum.photos/seed/movie4/300/450', backdrop: 'https://picsum.photos/seed/movie4bg/600/340', category: 'Sci-Fi', year: '2024', rating: '8.8', storyline: 'The galaxy faces its greatest threat as an ancient evil awakens from the depths of space.', type: 'movie', likes: 567, dislikes: 15, link: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', timestamp: Date.now() - 300000 },
  { id: 'demo5', title: 'The Comedy Club', poster: 'https://picsum.photos/seed/movie5/300/450', backdrop: 'https://picsum.photos/seed/movie5bg/600/340', category: 'Comedy', year: '2023', rating: '6.8', storyline: 'A struggling comedian gets one shot at the big time when a talent scout visits the local comedy club.', type: 'movie', likes: 156, dislikes: 30, link: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', timestamp: Date.now() - 400000 },
  { id: 'demo6', title: 'Shadow Protocol', poster: 'https://picsum.photos/seed/movie6/300/450', backdrop: 'https://picsum.photos/seed/movie6bg/600/340', category: 'Action', year: '2024', rating: '8.1', storyline: 'An elite team of operatives must prevent a global catastrophe when classified weapons fall into wrong hands.', type: 'movie', likes: 423, dislikes: 18, link: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', timestamp: Date.now() - 500000 },
  { id: 'demo7', title: 'Haunted Manor', poster: 'https://picsum.photos/seed/movie7/300/450', backdrop: 'https://picsum.photos/seed/movie7bg/600/340', category: 'Horror', year: '2023', rating: '7.5', storyline: 'A family moves into a centuries-old manor only to discover its dark and terrifying secrets.', type: 'movie', likes: 287, dislikes: 45, link: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', timestamp: Date.now() - 600000 },
  { id: 'demo8', title: 'Ocean\'s Depth', poster: 'https://picsum.photos/seed/movie8/300/450', backdrop: 'https://picsum.photos/seed/movie8bg/600/340', category: 'Adventure', year: '2024', rating: '7.7', storyline: 'A deep-sea expedition discovers an underwater civilization that challenges everything we know about history.', type: 'movie', likes: 198, dislikes: 9, link: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', timestamp: Date.now() - 700000 },
  { id: 'demos1', title: 'Dark Kingdom', poster: 'https://picsum.photos/seed/series1/300/450', backdrop: 'https://picsum.photos/seed/series1bg/600/340', category: 'Drama', year: '2024', rating: '9.1', storyline: 'In a world of political intrigue, noble families fight for control of the throne in this epic fantasy series.', type: 'series', likes: 892, dislikes: 23, episodes: [{season:1,episode:1,title:'The Beginning',link:'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',thumbnail:'https://picsum.photos/seed/ep1/320/180'},{season:1,episode:2,title:'The Rising',link:'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',thumbnail:'https://picsum.photos/seed/ep2/320/180'},{season:1,episode:3,title:'The Battle',link:'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',thumbnail:'https://picsum.photos/seed/ep3/320/180'},{season:2,episode:1,title:'New Dawn',link:'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',thumbnail:'https://picsum.photos/seed/ep4/320/180'},{season:2,episode:2,title:'Dark Alliance',link:'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',thumbnail:'https://picsum.photos/seed/ep5/320/180'}], timestamp: Date.now() - 50000 },
  { id: 'demos2', title: 'Cyber Heist', poster: 'https://picsum.photos/seed/series2/300/450', backdrop: 'https://picsum.photos/seed/series2bg/600/340', category: 'Thriller', year: '2023', rating: '8.4', storyline: 'A group of hackers plan the most ambitious digital heist in history, but nothing goes as planned.', type: 'series', likes: 445, dislikes: 16, episodes: [{season:1,episode:1,title:'The Plan',link:'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',thumbnail:'https://picsum.photos/seed/ep6/320/180'},{season:1,episode:2,title:'The Infiltration',link:'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',thumbnail:'https://picsum.photos/seed/ep7/320/180'}], timestamp: Date.now() - 150000 },
  { id: 'demos3', title: 'Medical Frontline', poster: 'https://picsum.photos/seed/series3/300/450', backdrop: 'https://picsum.photos/seed/series3bg/600/340', category: 'Drama', year: '2024', rating: '8.0', storyline: 'Follow the lives of dedicated doctors and nurses battling to save lives in a busy city hospital.', type: 'series', likes: 312, dislikes: 11, episodes: [{season:1,episode:1,title:'First Day',link:'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',thumbnail:'https://picsum.photos/seed/ep8/320/180'},{season:1,episode:2,title:'Emergency',link:'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',thumbnail:'https://picsum.photos/seed/ep9/320/180'},{season:1,episode:3,title:'Breaking Point',link:'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',thumbnail:'https://picsum.photos/seed/ep10/320/180'}], timestamp: Date.now() - 250000 },
];

const DEMO_CHANNELS: LiveChannel[] = [
  { id: 'ch1', name: 'News 24/7', logoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=news', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'News', likes: 100, dislikes: 5 },
  { id: 'ch2', name: 'Sports Live', logoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=sports', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'Sports', likes: 200, dislikes: 10 },
  { id: 'ch3', name: 'Music Mix', logoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=music', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'Music', likes: 150, dislikes: 3 },
  { id: 'ch4', name: 'Kids Fun', logoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=kids', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'Kids', likes: 88, dislikes: 2 },
  { id: 'ch5', name: 'Discovery World', logoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=discovery', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'Documentary', likes: 175, dislikes: 7 },
  { id: 'ch6', name: 'Movie Channel', logoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=moviechannel', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'Entertainment', likes: 220, dislikes: 8 },
];

// ============================================================
// MAIN APP COMPONENT
// ============================================================

export default function App() {
  // Core state
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false);

  // Page navigation
  const [currentPage, setCurrentPage] = useState('home');
  const [navHistory, setNavHistory] = useState<any[]>([]);
  const [headerScrolled, setHeaderScrolled] = useState(false);

  // Content state
  const [allContent, setAllContent] = useState<ContentItem[]>([]);
  const [allChannels, setAllChannels] = useState<LiveChannel[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [watchlist, setWatchlistState] = useState<ContentItem[]>([]);

  // UI state
  const [theme, setThemeState] = useState('classic-red');
  const [mode, setModeState] = useState('dark');
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  // Auth state
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Detail state
  const [detailItem, setDetailItem] = useState<ContentItem | null>(null);
  const [seriesDetailItem, setSeriesDetailItem] = useState<ContentItem | null>(null);
  const [selectedSeason, setSelectedSeason] = useState(1);

  // Player state
  const [playerItem, setPlayerItem] = useState<ContentItem | null>(null);
  const [playerType, setPlayerType] = useState<'movie' | 'series' | 'livetv'>('movie');
  const [showPlayer, setShowPlayer] = useState(false);
  const [playerError, setPlayerError] = useState(false);
  const [playerLoading, setPlayerLoading] = useState(true);
  const [currentEpisode, setCurrentEpisode] = useState<any>(null);
  const [currentChannel, setCurrentChannel] = useState<LiveChannel | null>(null);

  // Search state
  const [searchTerm, setSearchTermState] = useState('');
  const [searchResults, setSearchResults] = useState<ContentItem[]>([]);
  const [recentSearches, setRecentSearchesState] = useState<string[]>([]);

  // Category page
  const [categoryPageTitle, setCategoryPageTitle] = useState('');
  const [categoryPageItems, setCategoryPageItems] = useState<ContentItem[]>([]);

  // Live TV filter
  const [liveTvFilter, setLiveTvFilter] = useState('All');

  // Notification state
  const [dismissedNotifs, setDismissedNotifsState] = useState<string[]>([]);
  const [lastSeenNotif, setLastSeenNotifState] = useState(0);
  const [hasUnread, setHasUnread] = useState(false);

  // Modals
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('male');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [onboardingFlow, setOnboardingFlow] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState('');

  // Account settings
  const [settingsName, setSettingsName] = useState('');
  const [settingsGender, setSettingsGender] = useState('');

  // Movie request
  const [requestName, setRequestName] = useState('');
  const [requestYear, setRequestYear] = useState('');

  // Maintenance
  const [maintenance, setMaintenance] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState('');

  // Hero slider
  const [heroSlide, setHeroSlide] = useState(0);
  const heroInterval = useRef<any>(null);

  // Video refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const plyrRef = useRef<any>(null);
  const hlsRef = useRef<any>(null);

  // Like state tracking
  const [userInteraction, setUserInteraction] = useState<string | null>(null);

  // Scroll ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ============================================================
  // INITIALIZATION
  // ============================================================

  useEffect(() => {
    initFirebase();
    loadFromStorage();
    const s = getState();
    setThemeState(s.currentTheme);
    setModeState(s.currentMode);
    setWatchlistState(s.watchlist);
    setRecentSearchesState(s.recentSearches);
    setDismissedNotifsState(s.dismissedNotifications);
    setLastSeenNotifState(s.lastSeenNotifTimestamp);

    document.body.setAttribute('data-theme', s.currentTheme);
    document.body.setAttribute('data-mode', s.currentMode);

    const auth = getAuth();
    if (auth) {
      auth.onAuthStateChanged((user: any) => {
        if (user) {
          setCurrentUser(user);
          setAuthenticated(true);
          setIsGuest(user.isAnonymous || false);
          loadContent();
          loadNotifications(user);
          checkMaintenance();
        } else {
          setAuthenticated(false);
          setCurrentUser(null);
          setIsGuest(false);
        }
        setTimeout(() => setLoading(false), 800);
      });
    } else {
      // No firebase available, use demo data
      setAllContent(DEMO_CONTENT);
      setAllChannels(DEMO_CHANNELS);
      setAllCategories([...new Set(DEMO_CONTENT.map(c => c.category || 'Uncategorized'))]);
      setTimeout(() => setLoading(false), 800);
    }

    // Scroll listener
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        setHeaderScrolled(scrollContainerRef.current.scrollTop > 50);
      }
    };
    const container = scrollContainerRef.current;
    container?.addEventListener('scroll', handleScroll);
    return () => {
      container?.removeEventListener('scroll', handleScroll);
      if (heroInterval.current) clearInterval(heroInterval.current);
    };
  }, []);

  // Hero slider auto-advance
  useEffect(() => {
    const movies = allContent.filter(c => c.type === 'movie');
    const heroCount = Math.min(movies.length, 5);
    if (heroCount > 0 && currentPage === 'home') {
      heroInterval.current = setInterval(() => {
        setHeroSlide(prev => (prev + 1) % heroCount);
      }, 5000);
    }
    return () => {
      if (heroInterval.current) clearInterval(heroInterval.current);
    };
  }, [allContent, currentPage]);

  // Check unread notifications
  useEffect(() => {
    if (notifications.length > 0) {
      const latestTs = Math.max(...notifications.map(n => n.timestamp || 0));
      setHasUnread(latestTs > lastSeenNotif);
    }
  }, [notifications, lastSeenNotif]);

  // ============================================================
  // FIREBASE DATA LOADING
  // ============================================================

  const loadContent = useCallback(() => {
    const db = getDatabase();
    if (!db) {
      setAllContent(DEMO_CONTENT);
      setAllChannels(DEMO_CHANNELS);
      setAllCategories([...new Set(DEMO_CONTENT.map(c => c.category || 'Uncategorized'))]);
      return;
    }

    // Load movies
    db.ref('movies').on('value', (snap: any) => {
      const data = snap.val();
      const movies: ContentItem[] = [];
      if (data) {
        Object.keys(data).forEach(key => {
          movies.push({ ...data[key], id: key, type: 'movie' as const });
        });
      }

      // Load series
      db.ref('webseries').on('value', (sSnap: any) => {
        const sData = sSnap.val();
        const series: ContentItem[] = [];
        if (sData) {
          Object.keys(sData).forEach(key => {
            series.push({ ...sData[key], id: key, type: 'series' as const });
          });
        }

        const combined = [...movies, ...series];
        if (combined.length === 0) {
          setAllContent(DEMO_CONTENT);
          setAllCategories([...new Set(DEMO_CONTENT.map(c => c.category || 'Uncategorized'))]);
        } else {
          setAllContent(combined);
          const cats = [...new Set(combined.map(c => c.category || 'Uncategorized'))];
          setAllCategories(cats);
        }
      });
    });

    // Load live TV
    db.ref('livetv').on('value', (snap: any) => {
      const data = snap.val();
      const channels: LiveChannel[] = [];
      if (data) {
        Object.keys(data).forEach(key => {
          channels.push({ ...data[key], id: key });
        });
      }
      setAllChannels(channels.length > 0 ? channels : DEMO_CHANNELS);
    });

    // Load categories
    db.ref('categories').on('value', (snap: any) => {
      const data = snap.val();
      if (data) {
        const cats = Object.values(data).map((c: any) => c.name);
        if (cats.length > 0) setAllCategories(cats as string[]);
      }
    });
  }, []);

  const loadNotifications = useCallback((user: any) => {
    const db = getDatabase();
    if (!db) return;
    db.ref('notifications').on('value', (snap: any) => {
      const data = snap.val();
      const notifs: AppNotification[] = [];
      if (data) {
        Object.keys(data).forEach(key => {
          const n = { ...data[key], id: key };
          if (n.target === 'all' || (n.targetEmails && n.targetEmails.includes(user.email))) {
            if (!dismissedNotifs.includes(key)) {
              notifs.push(n);
            }
          }
        });
      }
      setNotifications(notifs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
    });
  }, [dismissedNotifs]);

  const checkMaintenance = useCallback(() => {
    const db = getDatabase();
    if (!db) return;
    db.ref('maintenance').on('value', (snap: any) => {
      const data = snap.val();
      if (data && data.enabled) {
        setMaintenance(true);
        setMaintenanceMsg(data.message || 'We are currently under maintenance. Please check back later.');
      } else {
        setMaintenance(false);
      }
    });
  }, []);

  // ============================================================
  // NAVIGATION
  // ============================================================

  const navigateTo = useCallback((page: string, data?: any) => {
    setNavHistory(prev => [...prev, { page: currentPage, data }]);
    setCurrentPage(page);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  }, [currentPage]);

  const goBack = useCallback(() => {
    destroyPlayer();
    if (navHistory.length > 0) {
      const prev = navHistory[navHistory.length - 1];
      setNavHistory(h => h.slice(0, -1));
      setCurrentPage(prev.page);
      setShowPlayer(false);
    } else {
      setCurrentPage('home');
      setShowPlayer(false);
    }
  }, [navHistory]);

  const handleNavClick = useCallback((page: string) => {
    setNavHistory([]);
    setCurrentPage(page);
    setShowPlayer(false);
    destroyPlayer();
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  }, []);

  // ============================================================
  // TOAST
  // ============================================================

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  }, []);

  // ============================================================
  // AUTH HANDLERS
  // ============================================================

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const auth = getAuth();
    if (!auth) {
      // Demo mode without firebase
      setAuthenticated(true);
      setCurrentUser({ displayName: 'Demo User', email, photoURL: DEFAULT_AVATAR, isAnonymous: false, uid: 'demo' });
      setIsGuest(false);
      setAllContent(DEMO_CONTENT);
      setAllChannels(DEMO_CHANNELS);
      setAllCategories([...new Set(DEMO_CONTENT.map(c => c.category || 'Uncategorized'))]);
      return;
    }
    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
    }
  }, []);

  const handleSignup = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const auth = getAuth();
    if (!auth) {
      setAuthenticated(true);
      setCurrentUser({ displayName: name, email, photoURL: DEFAULT_AVATAR, isAnonymous: false, uid: 'demo' });
      setIsGuest(false);
      setAllContent(DEMO_CONTENT);
      setAllChannels(DEMO_CHANNELS);
      setAllCategories([...new Set(DEMO_CONTENT.map(c => c.category || 'Uncategorized'))]);
      return;
    }
    try {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      await cred.user.updateProfile({ displayName: name, photoURL: DEFAULT_AVATAR });
      setOnboardingFlow(true);
      setShowGenderModal(true);
    } catch (err: any) {
      setAuthError(err.message || 'Signup failed');
    }
  }, []);

  const handleGuestLogin = useCallback(async () => {
    setAuthError('');
    const auth = getAuth();
    if (!auth) {
      setAuthenticated(true);
      setCurrentUser({ displayName: 'Guest User', email: '', photoURL: DEFAULT_AVATAR, isAnonymous: true, uid: 'guest' });
      setIsGuest(true);
      setAllContent(DEMO_CONTENT);
      setAllChannels(DEMO_CHANNELS);
      setAllCategories([...new Set(DEMO_CONTENT.map(c => c.category || 'Uncategorized'))]);
      return;
    }
    try {
      await auth.signInAnonymously();
    } catch (err: any) {
      setAuthError(err.message || 'Guest login failed. Enable Anonymous sign-in in Firebase Console.');
    }
  }, []);

  const handleLogout = useCallback(async () => {
    const auth = getAuth();
    if (auth) {
      await auth.signOut();
    }
    setAuthenticated(false);
    setCurrentUser(null);
    setCurrentPage('home');
    setNavHistory([]);
    setShowPlayer(false);
    destroyPlayer();
  }, []);

  // ============================================================
  // ONBOARDING (Gender + Avatar)
  // ============================================================

  const handleGenderSelect = useCallback((gender: 'male' | 'female') => {
    setSelectedGender(gender);
    setShowGenderModal(false);
    setShowAvatarModal(true);
  }, []);

  const handleAvatarSelect = useCallback(async (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl);
    const auth = getAuth();
    const db = getDatabase();
    const user = auth?.currentUser;
    if (user) {
      try {
        await user.updateProfile({ photoURL: avatarUrl });
        if (db) {
          await db.ref(`users/${user.uid}`).set({
            displayName: user.displayName,
            email: user.email,
            photoURL: avatarUrl,
            gender: selectedGender,
            createdAt: getFirebase()?.database?.ServerValue?.TIMESTAMP || Date.now(),
          });
        }
        setCurrentUser({ ...user });
        showToast('Profile setup complete!');
      } catch (err) {
        showToast('Failed to update profile');
      }
    }
    setShowAvatarModal(false);
    setOnboardingFlow(false);
  }, [selectedGender, showToast]);

  // ============================================================
  // THEME & MODE
  // ============================================================

  const applyTheme = useCallback((t: string) => {
    setThemeState(t);
    saveTheme(t);
    document.body.setAttribute('data-theme', t);
  }, []);

  const applyMode = useCallback((m: string) => {
    setModeState(m);
    saveMode(m);
    document.body.setAttribute('data-mode', m);
  }, []);

  // ============================================================
  // WATCHLIST
  // ============================================================

  const toggleWatchlist = useCallback((item: ContentItem) => {
    setWatchlistState(prev => {
      const exists = prev.find(w => w.id === item.id);
      let newList: ContentItem[];
      if (exists) {
        newList = prev.filter(w => w.id !== item.id);
        showToast('Removed from watchlist');
      } else {
        newList = [...prev, item];
        showToast('Added to watchlist');
      }
      saveWatchlist(newList);
      return newList;
    });
  }, [showToast]);

  const isInWatchlist = useCallback((id: string) => {
    return watchlist.some(w => w.id === id);
  }, [watchlist]);

  // ============================================================
  // SEARCH
  // ============================================================

  const performSearch = useCallback((term: string) => {
    setSearchTermState(term);
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    const lower = term.toLowerCase();
    const results = allContent.filter(c =>
      c.title.toLowerCase().includes(lower) ||
      (c.category || '').toLowerCase().includes(lower) ||
      (c.genre || '').toLowerCase().includes(lower)
    );
    setSearchResults(results);
  }, [allContent]);

  const saveSearch = useCallback((term: string) => {
    if (!term.trim()) return;
    setRecentSearchesState(prev => {
      const filtered = prev.filter(s => s !== term);
      const newList = [term, ...filtered].slice(0, 6);
      saveRecentSearches(newList);
      return newList;
    });
  }, []);

  const removeSearch = useCallback((term: string) => {
    setRecentSearchesState(prev => {
      const newList = prev.filter(s => s !== term);
      saveRecentSearches(newList);
      return newList;
    });
  }, []);

  const clearAllSearches = useCallback(() => {
    setRecentSearchesState([]);
    saveRecentSearches([]);
  }, []);

  // ============================================================
  // PLAYER
  // ============================================================

  const destroyPlayer = useCallback(() => {
    if (plyrRef.current) {
      try { plyrRef.current.destroy(); } catch {}
      plyrRef.current = null;
    }
    if (hlsRef.current) {
      try { hlsRef.current.destroy(); } catch {}
      hlsRef.current = null;
    }
  }, []);

  const initPlayer = useCallback((url: string) => {
    if (!videoRef.current) return;
    destroyPlayer();
    setPlayerError(false);
    setPlayerLoading(true);

    const video = videoRef.current;

    if (url.includes('.m3u8')) {
      const HlsConstructor = (window as any).Hls;
      if (HlsConstructor && HlsConstructor.isSupported()) {
        const hls = new HlsConstructor();
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(HlsConstructor.Events.MANIFEST_PARSED, () => {
          const PlyrConstructor = (window as any).Plyr;
          if (PlyrConstructor) {
            plyrRef.current = new PlyrConstructor(video, {
              controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
              autoplay: true,
            });
          }
          video.play().catch(() => {});
          setPlayerLoading(false);
        });
        hls.on(HlsConstructor.Events.ERROR, (_: any, data: any) => {
          if (data.fatal) {
            setPlayerError(true);
            setPlayerLoading(false);
          }
        });
        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.addEventListener('loadedmetadata', () => {
          const PlyrConstructor = (window as any).Plyr;
          if (PlyrConstructor) {
            plyrRef.current = new PlyrConstructor(video, {
              controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
              autoplay: true,
            });
          }
          video.play().catch(() => {});
          setPlayerLoading(false);
        });
      }
    } else {
      video.src = url;
      video.addEventListener('loadeddata', () => {
        const PlyrConstructor = (window as any).Plyr;
        if (PlyrConstructor) {
          plyrRef.current = new PlyrConstructor(video, {
            controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
            autoplay: true,
          });
        }
        video.play().catch(() => {});
        setPlayerLoading(false);
      });
      video.addEventListener('error', () => {
        setPlayerError(true);
        setPlayerLoading(false);
      });
    }
  }, [destroyPlayer]);

  const playMovie = useCallback((item: ContentItem) => {
    setPlayerItem(item);
    setPlayerType('movie');
    setShowPlayer(true);
    setPlayerError(false);
    setPlayerLoading(true);
    addToWatchHistory(item);
    setTimeout(() => {
      if (item.link) initPlayer(item.link);
      else { setPlayerError(true); setPlayerLoading(false); }
    }, 100);
  }, [initPlayer]);

  const playEpisode = useCallback((series: ContentItem, ep: any) => {
    setPlayerItem(series);
    setPlayerType('series');
    setCurrentEpisode(ep);
    setShowPlayer(true);
    setPlayerError(false);
    setPlayerLoading(true);
    addToWatchHistory(series);
    setTimeout(() => {
      if (ep.link) initPlayer(ep.link);
      else { setPlayerError(true); setPlayerLoading(false); }
    }, 100);
  }, [initPlayer]);

  const playLiveTv = useCallback((channel: LiveChannel) => {
    setCurrentChannel(channel);
    setPlayerType('livetv');
    setShowPlayer(true);
    setPlayerError(false);
    setPlayerLoading(true);
    setTimeout(() => {
      if (channel.streamUrl) initPlayer(channel.streamUrl);
      else { setPlayerError(true); setPlayerLoading(false); }
    }, 100);
  }, [initPlayer]);

  // ============================================================
  // WATCH HISTORY
  // ============================================================

  const addToWatchHistory = useCallback((item: ContentItem) => {
    const auth = getAuth();
    const db = getDatabase();
    const user = auth?.currentUser;
    if (user && db && !user.isAnonymous) {
      db.ref(`watch_history/${user.uid}/${item.id}`).set({
        id: item.id,
        timestamp: getFirebase()?.database?.ServerValue?.TIMESTAMP || Date.now(),
      }).catch(() => {});
    }
  }, []);

  // ============================================================
  // INTERACTIONS (Like/Dislike)
  // ============================================================

  const handleInteraction = useCallback(async (action: 'like' | 'dislike', item: ContentItem) => {
    const auth = getAuth();
    const db = getDatabase();
    const user = auth?.currentUser;
    if (!user || user.isAnonymous) {
      showToast('Please login to interact');
      return;
    }
    if (!db) return;

    try {
      const snap = await db.ref(`user_interactions/${user.uid}/${item.id}`).once('value');
      const currentAction = snap.val();
      const contentPath = item.type === 'movie' ? `movies/${item.id}` : `webseries/${item.id}`;
      const ServerValue = getFirebase()?.database?.ServerValue;

      if (currentAction === action) {
        // Remove interaction
        await db.ref(`user_interactions/${user.uid}/${item.id}`).remove();
        await db.ref(`${contentPath}/${action}s`).set(ServerValue?.increment ? ServerValue.increment(-1) : Math.max(0, (item[`${action}s` as 'likes' | 'dislikes'] || 1) - 1));
        setUserInteraction(null);
      } else {
        if (currentAction) {
          // Switch interaction
          const oldKey = `${currentAction}s` as 'likes' | 'dislikes';
          await db.ref(`${contentPath}/${oldKey}`).set(ServerValue?.increment ? ServerValue.increment(-1) : Math.max(0, (item[oldKey] || 1) - 1));
        }
        await db.ref(`user_interactions/${user.uid}/${item.id}`).set(action);
        await db.ref(`${contentPath}/${action}s`).set(ServerValue?.increment ? ServerValue.increment(1) : (item[`${action}s` as 'likes' | 'dislikes'] || 0) + 1);
        setUserInteraction(action);
      }
    } catch {
      showToast('Interaction failed');
    }
  }, [showToast]);

  // Load interaction status
  useEffect(() => {
    const auth = getAuth();
    const db = getDatabase();
    const user = auth?.currentUser;
    const item = playerItem || detailItem;
    if (user && db && item && !user.isAnonymous) {
      db.ref(`user_interactions/${user.uid}/${item.id}`).on('value', (snap: any) => {
        setUserInteraction(snap.val());
      });
    }
    return () => {
      if (user && db && item) {
        db.ref(`user_interactions/${user.uid}/${item.id}`).off();
      }
    };
  }, [playerItem, detailItem, currentUser]);

  // ============================================================
  // NOTIFICATIONS
  // ============================================================

  const dismissNotification = useCallback((id: string) => {
    setDismissedNotifsState(prev => {
      const newList = [...prev, id];
      saveDismissedNotifications(newList);
      return newList;
    });
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const markNotifsSeen = useCallback(() => {
    const ts = Date.now();
    setLastSeenNotifState(ts);
    saveLastSeenNotif(ts);
    setHasUnread(false);
  }, []);

  // ============================================================
  // ACCOUNT SETTINGS
  // ============================================================

  const handleSaveSettings = useCallback(async () => {
    const auth = getAuth();
    const db = getDatabase();
    const user = auth?.currentUser;
    if (!user) return;
    try {
      await user.updateProfile({ displayName: settingsName });
      if (db) {
        await db.ref(`users/${user.uid}`).update({
          displayName: settingsName,
          gender: settingsGender,
        });
      }
      setCurrentUser({ ...user });
      showToast('Settings saved!');
      goBack();
    } catch {
      showToast('Failed to save settings');
    }
  }, [settingsName, settingsGender, showToast, goBack]);

  // ============================================================
  // MOVIE REQUEST
  // ============================================================

  const handleMovieRequest = useCallback(async () => {
    const auth = getAuth();
    const db = getDatabase();
    const user = auth?.currentUser;
    if (!user || user.isAnonymous) {
      showToast('Login required for movie requests');
      return;
    }
    if (!requestName.trim()) {
      showToast('Please enter movie name');
      return;
    }
    if (!db) { showToast('Database not available'); return; }
    try {
      await db.ref('movie_requests').push({
        movieName: requestName,
        movieYear: requestYear,
        requestedBy: user.email,
        uid: user.uid,
        timestamp: getFirebase()?.database?.ServerValue?.TIMESTAMP || Date.now(),
      });
      showToast('Movie request submitted!');
      setRequestName('');
      setRequestYear('');
      goBack();
    } catch {
      showToast('Request failed');
    }
  }, [requestName, requestYear, showToast, goBack]);

  // ============================================================
  // PROFILE AVATAR CHANGE
  // ============================================================

  const handleProfileAvatarChange = useCallback(() => {
    if (isGuest) {
      showToast('Login required');
      return;
    }
    setShowGenderModal(true);
    setOnboardingFlow(false);
  }, [isGuest, showToast]);

  const handleProfileAvatarSelect = useCallback(async (avatarUrl: string) => {
    const auth = getAuth();
    const db = getDatabase();
    const user = auth?.currentUser;
    if (user) {
      try {
        await user.updateProfile({ photoURL: avatarUrl });
        if (db) {
          await db.ref(`users/${user.uid}/photoURL`).set(avatarUrl);
        }
        setCurrentUser({ ...user });
        showToast('Avatar updated!');
      } catch {
        showToast('Failed to update avatar');
      }
    }
    setShowAvatarModal(false);
  }, [showToast]);

  // ============================================================
  // HELPERS
  // ============================================================

  const getContentByCategory = useCallback((category: string) => {
    return allContent.filter(c => c.category === category);
  }, [allContent]);

  const getMovies = useCallback(() => allContent.filter(c => c.type === 'movie'), [allContent]);
  const getSeries = useCallback(() => allContent.filter(c => c.type === 'series'), [allContent]);

  const getEpisodesBySeason = useCallback((episodes: any, season: number) => {
    if (!episodes) return [];
    const epArray = Array.isArray(episodes) ? episodes : Object.values(episodes);
    return (epArray as any[]).filter(ep => ep && ep.season === season);
  }, []);

  const getSeasons = useCallback((episodes: any): number[] => {
    if (!episodes) return [];
    const epArray = Array.isArray(episodes) ? episodes : Object.values(episodes);
    const seasons = [...new Set((epArray as any[]).filter(ep => ep).map(ep => ep.season))];
    return seasons.sort((a, b) => a - b);
  }, []);

  const getSimilarContent = useCallback((item: ContentItem) => {
    return allContent.filter(c => c.id !== item.id && (c.category === item.category || c.type === item.type)).slice(0, 10);
  }, [allContent]);

  const getChannelCategories = useCallback(() => {
    return ['All', ...new Set(allChannels.map(c => c.category))];
  }, [allChannels]);

  const formatTimeAgo = useCallback((ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }, []);

  const getMemberSince = useCallback(() => {
    if (!currentUser?.metadata?.creationTime) return 'Today';
    const created = new Date(currentUser.metadata.creationTime);
    const now = new Date();
    const diff = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return '1 day';
    return `${diff} days`;
  }, [currentUser]);

  // ============================================================
  // SHARE
  // ============================================================
  const handleShare = useCallback((item: ContentItem) => {
    if (navigator.share) {
      navigator.share({ title: item.title, text: `Check out ${item.title} on MOVIEHUNT!`, url: window.location.href });
    } else {
      navigator.clipboard?.writeText(`Check out ${item.title} on MOVIEHUNT!`);
      showToast('Link copied!');
    }
  }, [showToast]);

  // ============================================================
  // PAGE TITLE FOR HEADER
  // ============================================================

  const getPageTitle = useCallback(() => {
    switch (currentPage) {
      case 'home': return '';
      case 'search': return 'Search';
      case 'series': return 'Web Series';
      case 'livetv': return 'Live TV';
      case 'watchlist': return 'My Watchlist';
      case 'profile': return 'Profile';
      case 'notifications': return 'Notifications';
      case 'detail': return '';
      case 'seriesDetail': return '';
      case 'themes': return 'Appearance';
      case 'accountSettings': return 'Account Settings';
      case 'movieRequest': return 'Movie Request';
      case 'history': return 'Watch History';
      case 'help': return 'Help & Support';
      case 'privacy': return 'Privacy Policy';
      case 'categoryPage': return categoryPageTitle;
      default: return '';
    }
  }, [currentPage, categoryPageTitle]);

  const showBackButton = !['home', 'series', 'livetv', 'watchlist', 'profile'].includes(currentPage);
  const showBottomNav = !showPlayer;
  const pageTitle = getPageTitle();

  // ============================================================
  // RENDER THEME OPTIONS
  // ============================================================

  const themeOptions = [
    { id: 'classic-red', name: 'Classic Red', color: '#e50914' },
    { id: 'ocean-blue', name: 'Ocean Blue', color: '#0088ff' },
    { id: 'neon-green', name: 'Neon Green', color: '#00e676' },
    { id: 'royal-purple', name: 'Royal Purple', color: '#aa00ff' },
    { id: 'sunset-orange', name: 'Sunset Orange', color: '#ff6d00' },
    { id: 'golden-yellow', name: 'Golden Yellow', color: '#ffd600' },
  ];

  // ============================================================
  // RENDER
  // ============================================================

  // Maintenance override
  if (maintenance) {
    return (
      <div className="maintenance-page">
        <i className="fas fa-wrench"></i>
        <h2>Under Maintenance</h2>
        <p>{maintenanceMsg}</p>
      </div>
    );
  }

  // Loading screen
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">MOVIEHUNT</div>
        <div className="loading-spinner-ring"></div>
      </div>
    );
  }

  // Auth screen
  if (!authenticated) {
    return (
      <div className="auth-container">
        <div className="auth-backdrop"></div>
        <div className="auth-content">
          <div className="auth-brand">
            <h1>MOVIEHUNT</h1>
            <p>Stream Movies, Series & Live TV</p>
          </div>
          <div className="auth-form-container">
            <div className="auth-tabs">
              <button className={`auth-tab ${authTab === 'login' ? 'active' : ''}`} onClick={() => { setAuthTab('login'); setAuthError(''); }}>Login</button>
              <button className={`auth-tab ${authTab === 'signup' ? 'active' : ''}`} onClick={() => { setAuthTab('signup'); setAuthError(''); }}>Sign Up</button>
            </div>

            {authTab === 'login' ? (
              <form onSubmit={handleLogin}>
                <div className="input-group">
                  <i className="fas fa-envelope field-icon"></i>
                  <input name="email" type="email" placeholder="Email Address" required />
                </div>
                <div className="input-group">
                  <i className="fas fa-lock field-icon"></i>
                  <input name="password" type={showPassword ? 'text' : 'password'} placeholder="Password" required />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                <button type="submit" className="auth-btn">Login</button>
              </form>
            ) : (
              <form onSubmit={handleSignup}>
                <div className="input-group">
                  <i className="fas fa-user field-icon"></i>
                  <input name="name" type="text" placeholder="Full Name" required />
                </div>
                <div className="input-group">
                  <i className="fas fa-envelope field-icon"></i>
                  <input name="email" type="email" placeholder="Email Address" required />
                </div>
                <div className="input-group">
                  <i className="fas fa-lock field-icon"></i>
                  <input name="password" type={showPassword ? 'text' : 'password'} placeholder="Password" required minLength={6} />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                <button type="submit" className="auth-btn">Create Account</button>
              </form>
            )}

            {authError && <div className="auth-error">{authError}</div>}

            <div className="auth-divider"><span>OR</span></div>
            <button className="guest-btn" onClick={handleGuestLogin}>
              <i className="fas fa-user-secret"></i> Continue as Guest
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN APP
  // ============================================================

  const movies = getMovies();
  const series = getSeries();
  const heroMovies = movies.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 5);

  return (
    <div className="app-container" style={{ background: 'var(--bg-color)' }}>
      {/* Header */}
      <header className={`app-header ${headerScrolled ? 'scrolled' : ''}`}>
        <div className="header-inner">
          <div className="header-left">
            {showBackButton && (
              <button className="header-back-btn" onClick={goBack}>
                <i className="fas fa-arrow-left"></i>
              </button>
            )}
            {!pageTitle ? (
              <span className="header-logo">MOVIEHUNT</span>
            ) : (
              <span className="header-title" style={{ display: 'block' }}>{pageTitle}</span>
            )}
          </div>
          <div className="header-right">
            <button className="header-icon-btn" onClick={() => navigateTo('search')}>
              <i className="fas fa-search"></i>
            </button>
            <button className="header-icon-btn" onClick={() => { navigateTo('notifications'); markNotifsSeen(); }}>
              <i className="fas fa-bell"></i>
              <span className={`notif-badge ${hasUnread ? 'show' : ''}`}></span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div ref={scrollContainerRef} style={{ overflowY: 'auto', height: 'calc(100vh - 120px)' }}>

        {/* ===== HOME PAGE ===== */}
        {currentPage === 'home' && (
          <div className="page-container active">
            {/* Hero Slider */}
            {heroMovies.length > 0 && (
              <div className="hero-section">
                <div className="hero-slider-track" style={{ transform: `translateX(-${heroSlide * 100}%)` }}>
                  {heroMovies.map((movie, _i) => (
                    <div
                      key={movie.id}
                      className="hero-slide"
                      style={{ backgroundImage: `url(${movie.backdrop || movie.poster})` }}
                      onClick={() => { setDetailItem(movie); navigateTo('detail'); }}
                    >
                      <div className="hero-slide-overlay">
                        <div className="hero-slide-title">{movie.title}</div>
                        <div className="hero-slide-meta">
                          {movie.year && <span>{movie.year}</span>}
                          {movie.rating && <span className="badge">⭐ {movie.rating}</span>}
                          {movie.category && <span>{movie.category}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hero-indicators">
                  {heroMovies.map((_, i) => (
                    <button key={i} className={`hero-dot ${i === heroSlide ? 'active' : ''}`} onClick={() => setHeroSlide(i)} />
                  ))}
                </div>
              </div>
            )}

            {/* Trending Now */}
            {movies.length > 0 && (
              <div className="detail-section" style={{ marginTop: '0.5rem' }}>
                <div className="section-header">
                  <span className="section-title">🔥 Trending Now</span>
                  <button className="section-see-all" onClick={() => { setCategoryPageTitle('Trending'); setCategoryPageItems(movies); navigateTo('categoryPage'); }}>See All</button>
                </div>
                <div className="content-slider">
                  {movies.slice(0, 10).map((movie, i) => (
                    <div key={movie.id} className="content-card trending-card" onClick={() => { setDetailItem(movie); navigateTo('detail'); }}>
                      <div className="content-card-poster">
                        <img src={movie.poster} alt={movie.title} loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450/1a1a2e/666?text=No+Image'; }} />
                      </div>
                      <span className="trending-rank">{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Latest Series */}
            {series.length > 0 && (
              <div className="detail-section">
                <div className="section-header">
                  <span className="section-title">📺 Latest Series</span>
                  <button className="section-see-all" onClick={() => handleNavClick('series')}>See All</button>
                </div>
                <div className="content-slider">
                  {series.map(s => (
                    <div key={s.id} className="backdrop-card" onClick={() => { setSeriesDetailItem(s); setSelectedSeason(getSeasons(s.episodes)[0] || 1); navigateTo('seriesDetail'); }}>
                      <div className="backdrop-card-img">
                        <img src={s.backdrop || s.poster} alt={s.title} loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x340/1a1a2e/666?text=No+Image'; }} />
                        <div className="backdrop-card-overlay">
                          <div className="backdrop-card-title">{s.title}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            {allCategories.map(cat => {
              const catItems = getContentByCategory(cat);
              if (catItems.length === 0) return null;
              return (
                <div key={cat} className="detail-section">
                  <div className="section-header">
                    <span className="section-title">{cat}</span>
                    <button className="section-see-all" onClick={() => { setCategoryPageTitle(cat); setCategoryPageItems(catItems); navigateTo('categoryPage'); }}>See All</button>
                  </div>
                  <div className="content-slider">
                    {catItems.map(item => (
                      <div key={item.id} className="content-card" onClick={() => {
                        if (item.type === 'series') { setSeriesDetailItem(item); setSelectedSeason(getSeasons(item.episodes)[0] || 1); navigateTo('seriesDetail'); }
                        else { setDetailItem(item); navigateTo('detail'); }
                      }}>
                        <div className="content-card-poster">
                          <img src={item.poster} alt={item.title} loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450/1a1a2e/666?text=No+Image'; }} />
                          <div className="content-card-overlay">
                            <div className="content-card-title">{item.title}</div>
                            {item.year && <div className="content-card-year">{item.year}</div>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ===== SERIES PAGE ===== */}
        {currentPage === 'series' && (
          <div className="page-container active" style={{ padding: '1rem' }}>
            {series.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-tv"></i>
                <h3>No Series Available</h3>
                <p>Check back later for new series</p>
              </div>
            ) : (
              <div className="category-grid">
                {series.map(s => (
                  <div key={s.id} className="content-card" onClick={() => { setSeriesDetailItem(s); setSelectedSeason(getSeasons(s.episodes)[0] || 1); navigateTo('seriesDetail'); }}>
                    <div className="content-card-poster">
                      <img src={s.poster} alt={s.title} loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450/1a1a2e/666?text=No+Image'; }} />
                      <div className="content-card-overlay">
                        <div className="content-card-title">{s.title}</div>
                        {s.year && <div className="content-card-year">{s.year}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== LIVE TV PAGE ===== */}
        {currentPage === 'livetv' && (
          <div className="livetv-browse page-container active">
            <div className="filter-tabs">
              {getChannelCategories().map(cat => (
                <button key={cat} className={`filter-tab ${liveTvFilter === cat ? 'active' : ''}`} onClick={() => setLiveTvFilter(cat)}>{cat}</button>
              ))}
            </div>
            {(() => {
              const filtered = liveTvFilter === 'All' ? allChannels : allChannels.filter(c => c.category === liveTvFilter);
              const grouped: Record<string, LiveChannel[]> = {};
              filtered.forEach(ch => {
                if (!grouped[ch.category]) grouped[ch.category] = [];
                grouped[ch.category].push(ch);
              });
              return Object.entries(grouped).map(([cat, channels]) => (
                <div key={cat} className="detail-section">
                  <div className="section-header">
                    <span className="section-title">{cat}</span>
                    <span className="live-badge">LIVE</span>
                  </div>
                  <div className="content-slider">
                    {channels.map(ch => (
                      <div key={ch.id} className="channel-card" onClick={() => playLiveTv(ch)}>
                        <img src={ch.logoUrl} alt={ch.name} onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/120/1a1a2e/666?text=TV'; }} />
                        <span className="channel-card-name">{ch.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
            {allChannels.length === 0 && (
              <div className="empty-state">
                <i className="fas fa-satellite-dish"></i>
                <h3>No Channels Available</h3>
                <p>Live TV channels will appear here</p>
              </div>
            )}
          </div>
        )}

        {/* ===== SEARCH PAGE ===== */}
        {currentPage === 'search' && (
          <div className="search-page page-container active">
            <div className="search-input-container">
              <i className="fas fa-search search-icon"></i>
              <input
                className="search-input"
                placeholder="Search movies, series..."
                value={searchTerm}
                onChange={e => performSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && searchTerm.trim()) saveSearch(searchTerm.trim()); }}
                autoFocus
              />
              <button className={`search-clear-btn ${searchTerm ? 'show' : ''}`} onClick={() => { setSearchTermState(''); setSearchResults([]); }}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            {!searchTerm.trim() ? (
              <>
                {recentSearches.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span className="search-section-title">Recent Searches</span>
                      <button className="section-see-all" onClick={clearAllSearches}>Clear All</button>
                    </div>
                    <div className="recent-search-list">
                      {recentSearches.map(term => (
                        <div key={term} className="recent-search-item">
                          <span onClick={() => { performSearch(term); setSearchTermState(term); }}><i className="fas fa-clock" style={{ marginRight: '8px', fontSize: '0.8rem' }}></i>{term}</span>
                          <button onClick={() => removeSearch(term)}><i className="fas fa-times"></i></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <span className="search-section-title">Popular Categories</span>
                  <div className="popular-tags" style={{ marginTop: '0.5rem' }}>
                    {allCategories.map(cat => (
                      <button key={cat} className="popular-tag" onClick={() => { performSearch(cat); setSearchTermState(cat); }}>{cat}</button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div>
                {searchResults.length > 0 ? (
                  searchResults.map(item => (
                    <div key={item.id} className="search-result-card" onClick={() => {
                      saveSearch(searchTerm.trim());
                      if (item.type === 'series') { setSeriesDetailItem(item); setSelectedSeason(getSeasons(item.episodes)[0] || 1); navigateTo('seriesDetail'); }
                      else { setDetailItem(item); navigateTo('detail'); }
                    }}>
                      <div className="search-result-poster">
                        <img src={item.poster} alt={item.title} onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450/1a1a2e/666?text=No+Image'; }} />
                      </div>
                      <div className="search-result-info">
                        <div className="search-result-title">{item.title}</div>
                        <div className="search-result-meta">{item.year} · {item.category} · {item.type === 'series' ? 'Series' : 'Movie'}</div>
                        {item.storyline && <div className="search-result-storyline">{item.storyline}</div>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <i className="fas fa-search"></i>
                    <h3>No Results Found</h3>
                    <p>Try different keywords</p>
                    {!isGuest && (
                      <button className="empty-state-btn" onClick={() => { setRequestName(searchTerm); navigateTo('movieRequest'); }}>
                        <i className="fas fa-plus" style={{ marginRight: '6px' }}></i> Request Movie
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== WATCHLIST PAGE ===== */}
        {currentPage === 'watchlist' && (
          <div className="watchlist-page page-container active">
            {watchlist.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-bookmark"></i>
                <h3>Watchlist is Empty</h3>
                <p>Start adding movies and series to your watchlist</p>
                <button className="empty-state-btn" onClick={() => handleNavClick('home')}>Browse Content</button>
              </div>
            ) : (
              watchlist.map(item => (
                <div key={item.id} className="watchlist-card" onClick={() => {
                  if (item.type === 'series') { setSeriesDetailItem(item); setSelectedSeason(getSeasons(item.episodes)[0] || 1); navigateTo('seriesDetail'); }
                  else { setDetailItem(item); navigateTo('detail'); }
                }}>
                  <div className="watchlist-poster">
                    <img src={item.poster} alt={item.title} onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450/1a1a2e/666?text=No+Image'; }} />
                  </div>
                  <div className="watchlist-info">
                    <div className="watchlist-title">{item.title}</div>
                    <div className="watchlist-meta">{item.year} · {item.category} · {item.type === 'series' ? 'Series' : 'Movie'}</div>
                  </div>
                  <button className="watchlist-remove" onClick={e => { e.stopPropagation(); toggleWatchlist(item); }}>
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ===== DETAIL PAGE (Movie) ===== */}
        {currentPage === 'detail' && detailItem && (
          <div className="detail-page page-container active">
            <div className="detail-backdrop">
              <img src={detailItem.backdrop || detailItem.poster} alt={detailItem.title} onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x340/1a1a2e/666?text=No+Image'; }} />
              <div className="detail-backdrop-gradient"></div>
            </div>
            <div className="detail-content">
              <h1 className="detail-title">{detailItem.title}</h1>
              <div className="detail-meta">
                {detailItem.year && <span>{detailItem.year}</span>}
                {detailItem.rating && <span className="rating">⭐ {detailItem.rating}</span>}
                {detailItem.category && <span className="badge">{detailItem.category}</span>}
                <span>{detailItem.type === 'series' ? 'Series' : 'Movie'}</span>
              </div>
              <div className="detail-actions">
                <button className="detail-play-btn" onClick={() => playMovie(detailItem)}>
                  <i className="fas fa-play"></i> Play Now
                </button>
                <button className={`detail-action-btn ${isInWatchlist(detailItem.id) ? 'active' : ''}`} onClick={() => toggleWatchlist(detailItem)}>
                  <i className={`fas ${isInWatchlist(detailItem.id) ? 'fa-check' : 'fa-plus'}`}></i>
                </button>
                <button className="detail-action-btn" onClick={() => handleShare(detailItem)}>
                  <i className="fas fa-share"></i>
                </button>
                {detailItem.trailer && (
                  <button className="detail-action-btn" onClick={() => { setTrailerUrl(detailItem.trailer!.replace('watch?v=', 'embed/')); setShowTrailer(true); }}>
                    <i className="fas fa-film"></i>
                  </button>
                )}
              </div>

              {detailItem.storyline && (
                <div className="detail-section">
                  <h3 className="detail-section-title">Storyline</h3>
                  <p className="detail-storyline">{detailItem.storyline}</p>
                </div>
              )}

              {detailItem.cast && detailItem.cast.length > 0 && (
                <div className="detail-section">
                  <h3 className="detail-section-title">Cast</h3>
                  <div className="detail-cast-list">
                    {detailItem.cast.map((c, i) => (
                      <div key={i} className="cast-item">
                        <img src={c.photo} alt={c.name} onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }} />
                        <span>{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* More Like This */}
              <div className="detail-section">
                <h3 className="detail-section-title">More Like This</h3>
                <div className="content-slider" style={{ paddingLeft: 0 }}>
                  {getSimilarContent(detailItem).map(item => (
                    <div key={item.id} className="content-card" onClick={() => {
                      if (item.type === 'series') { setSeriesDetailItem(item); setSelectedSeason(getSeasons(item.episodes)[0] || 1); setCurrentPage('seriesDetail'); }
                      else { setDetailItem(item); setCurrentPage('detail'); }
                      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
                    }}>
                      <div className="content-card-poster">
                        <img src={item.poster} alt={item.title} loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450/1a1a2e/666?text=No+Image'; }} />
                        <div className="content-card-overlay">
                          <div className="content-card-title">{item.title}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== SERIES DETAIL PAGE ===== */}
        {currentPage === 'seriesDetail' && seriesDetailItem && (
          <div className="detail-page page-container active">
            <div className="detail-backdrop">
              <img src={seriesDetailItem.backdrop || seriesDetailItem.poster} alt={seriesDetailItem.title} onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x340/1a1a2e/666?text=No+Image'; }} />
              <div className="detail-backdrop-gradient"></div>
            </div>
            <div className="detail-content">
              <h1 className="detail-title">{seriesDetailItem.title}</h1>
              <div className="detail-meta">
                {seriesDetailItem.year && <span>{seriesDetailItem.year}</span>}
                {seriesDetailItem.rating && <span className="rating">⭐ {seriesDetailItem.rating}</span>}
                {seriesDetailItem.category && <span className="badge">{seriesDetailItem.category}</span>}
                <span>Series</span>
              </div>
              <div className="detail-actions">
                <button className={`detail-action-btn ${isInWatchlist(seriesDetailItem.id) ? 'active' : ''}`} onClick={() => toggleWatchlist(seriesDetailItem)} style={{ flex: 'unset' }}>
                  <i className={`fas ${isInWatchlist(seriesDetailItem.id) ? 'fa-check' : 'fa-plus'}`}></i>
                </button>
                <button className="detail-action-btn" onClick={() => handleShare(seriesDetailItem)}>
                  <i className="fas fa-share"></i>
                </button>
              </div>

              {seriesDetailItem.storyline && (
                <div className="detail-section">
                  <h3 className="detail-section-title">Storyline</h3>
                  <p className="detail-storyline">{seriesDetailItem.storyline}</p>
                </div>
              )}

              {seriesDetailItem.cast && seriesDetailItem.cast.length > 0 && (
                <div className="detail-section">
                  <h3 className="detail-section-title">Cast</h3>
                  <div className="detail-cast-list">
                    {seriesDetailItem.cast.map((c, i) => (
                      <div key={i} className="cast-item">
                        <img src={c.photo} alt={c.name} onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }} />
                        <span>{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Episodes */}
              {seriesDetailItem.episodes && (
                <div className="detail-section">
                  <h3 className="detail-section-title">Episodes</h3>
                  <div className="season-tabs">
                    {getSeasons(seriesDetailItem.episodes).map(s => (
                      <button key={s} className={`season-tab ${selectedSeason === s ? 'active' : ''}`} onClick={() => setSelectedSeason(s)}>
                        Season {s}
                      </button>
                    ))}
                  </div>
                  {getEpisodesBySeason(seriesDetailItem.episodes, selectedSeason).map((ep: any, i: number) => (
                    <div key={i} className="episode-card" onClick={() => playEpisode(seriesDetailItem, ep)}>
                      <div className="episode-thumb">
                        <img src={ep.thumbnail || seriesDetailItem.poster} alt={ep.title} onError={(e) => { (e.target as HTMLImageElement).src = seriesDetailItem.poster; }} />
                        <div className="episode-play-overlay" style={{ opacity: 1 }}>
                          <i className="fas fa-play-circle"></i>
                        </div>
                      </div>
                      <div className="episode-info">
                        <span className="episode-number">S{ep.season} · E{ep.episode}</span>
                        <span className="episode-title">{ep.title || `Episode ${ep.episode}`}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* More Like This */}
              <div className="detail-section">
                <h3 className="detail-section-title">More Like This</h3>
                <div className="content-slider" style={{ paddingLeft: 0 }}>
                  {getSimilarContent(seriesDetailItem).map(item => (
                    <div key={item.id} className="content-card" onClick={() => {
                      if (item.type === 'series') { setSeriesDetailItem(item); setSelectedSeason(getSeasons(item.episodes)[0] || 1); }
                      else { setDetailItem(item); setCurrentPage('detail'); }
                      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
                    }}>
                      <div className="content-card-poster">
                        <img src={item.poster} alt={item.title} loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450/1a1a2e/666?text=No+Image'; }} />
                        <div className="content-card-overlay">
                          <div className="content-card-title">{item.title}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== CATEGORY PAGE ===== */}
        {currentPage === 'categoryPage' && (
          <div className="category-page page-container active">
            <div className="category-grid">
              {categoryPageItems.map(item => (
                <div key={item.id} className="content-card" onClick={() => {
                  if (item.type === 'series') { setSeriesDetailItem(item); setSelectedSeason(getSeasons(item.episodes)[0] || 1); navigateTo('seriesDetail'); }
                  else { setDetailItem(item); navigateTo('detail'); }
                }}>
                  <div className="content-card-poster">
                    <img src={item.poster} alt={item.title} loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450/1a1a2e/666?text=No+Image'; }} />
                    <div className="content-card-overlay">
                      <div className="content-card-title">{item.title}</div>
                      {item.year && <div className="content-card-year">{item.year}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== NOTIFICATIONS PAGE ===== */}
        {currentPage === 'notifications' && (
          <div className="notifications-page page-container active">
            {notifications.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-bell-slash"></i>
                <h3>No Notifications</h3>
                <p>You're all caught up!</p>
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className="notification-card">
                  <div className="notification-icon-wrap">
                    <i className={n.icon || 'fas fa-bell'}></i>
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{n.title}</div>
                    <div className="notification-message">{n.message}</div>
                    {n.timestamp && <div className="notification-time">{formatTimeAgo(n.timestamp)}</div>}
                  </div>
                  <button className="notification-dismiss" onClick={() => dismissNotification(n.id)}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ===== PROFILE PAGE ===== */}
        {currentPage === 'profile' && (
          <div className="profile-page page-container active">
            <div className="profile-header-card">
              <div className="profile-avatar-container">
                <img className="profile-avatar" src={currentUser?.photoURL || DEFAULT_AVATAR} alt="Avatar" onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }} />
                {!isGuest && (
                  <button className="profile-avatar-edit" onClick={handleProfileAvatarChange}>
                    <i className="fas fa-camera"></i>
                  </button>
                )}
              </div>
              <div className="profile-name">{currentUser?.displayName || (isGuest ? 'Guest User' : 'User')}</div>
              <div className="profile-email">{currentUser?.email || 'Guest Mode'}</div>
              <div className="profile-stat">
                <i className="fas fa-calendar-alt"></i> Member for {getMemberSince()}
              </div>
            </div>

            <div className="profile-menu">
              <div className="profile-menu-item" onClick={() => handleNavClick('watchlist')}>
                <div className="profile-menu-icon" style={{ background: 'rgba(229,9,20,0.15)', color: '#e50914' }}><i className="fas fa-bookmark"></i></div>
                <div className="profile-menu-text"><h4>My Watchlist</h4><p>{watchlist.length} items saved</p></div>
                <i className="fas fa-chevron-right profile-menu-arrow"></i>
              </div>

              <div className="profile-menu-item" onClick={() => navigateTo('history')}>
                <div className="profile-menu-icon" style={{ background: 'rgba(0,136,255,0.15)', color: '#0088ff' }}><i className="fas fa-history"></i></div>
                <div className="profile-menu-text"><h4>Watch History</h4><p>Your viewing activity</p></div>
                <i className="fas fa-chevron-right profile-menu-arrow"></i>
              </div>

              {!isGuest && (
                <div className="profile-menu-item" onClick={() => { setRequestName(''); setRequestYear(''); navigateTo('movieRequest'); }}>
                  <div className="profile-menu-icon" style={{ background: 'rgba(0,230,118,0.15)', color: '#00e676' }}><i className="fas fa-plus-circle"></i></div>
                  <div className="profile-menu-text"><h4>Request a Movie</h4><p>Can't find something? Request it!</p></div>
                  <i className="fas fa-chevron-right profile-menu-arrow"></i>
                </div>
              )}

              {!isGuest && (
                <div className="profile-menu-item" onClick={() => {
                  setSettingsName(currentUser?.displayName || '');
                  setSettingsGender('');
                  navigateTo('accountSettings');
                }}>
                  <div className="profile-menu-icon" style={{ background: 'rgba(170,0,255,0.15)', color: '#aa00ff' }}><i className="fas fa-user-cog"></i></div>
                  <div className="profile-menu-text"><h4>Account Settings</h4><p>Update your profile</p></div>
                  <i className="fas fa-chevron-right profile-menu-arrow"></i>
                </div>
              )}

              <div className="profile-menu-item" onClick={() => navigateTo('themes')}>
                <div className="profile-menu-icon" style={{ background: 'rgba(255,214,0,0.15)', color: '#ffd600' }}><i className="fas fa-palette"></i></div>
                <div className="profile-menu-text"><h4>Appearance</h4><p>Theme & display settings</p></div>
                <i className="fas fa-chevron-right profile-menu-arrow"></i>
              </div>

              <div className="profile-menu-item" onClick={() => navigateTo('help')}>
                <div className="profile-menu-icon" style={{ background: 'rgba(0,200,83,0.15)', color: '#00c853' }}><i className="fas fa-question-circle"></i></div>
                <div className="profile-menu-text"><h4>Help & Support</h4><p>FAQ and contact info</p></div>
                <i className="fas fa-chevron-right profile-menu-arrow"></i>
              </div>

              <div className="profile-menu-item" onClick={() => navigateTo('privacy')}>
                <div className="profile-menu-icon" style={{ background: 'rgba(255,109,0,0.15)', color: '#ff6d00' }}><i className="fas fa-shield-alt"></i></div>
                <div className="profile-menu-text"><h4>Privacy Policy</h4><p>Your data, your rights</p></div>
                <i className="fas fa-chevron-right profile-menu-arrow"></i>
              </div>

              <div className="profile-menu-item" onClick={handleLogout} style={{ marginTop: '0.5rem' }}>
                <div className="profile-menu-icon" style={{ background: 'rgba(255,23,68,0.15)', color: '#ff1744' }}><i className="fas fa-sign-out-alt"></i></div>
                <div className="profile-menu-text"><h4>Logout</h4><p>{isGuest ? 'Exit guest mode' : 'Sign out of your account'}</p></div>
                <i className="fas fa-chevron-right profile-menu-arrow"></i>
              </div>
            </div>
          </div>
        )}

        {/* ===== THEMES PAGE ===== */}
        {currentPage === 'themes' && (
          <div className="settings-page page-container active">
            <div className="mode-toggle-container">
              <span className="mode-toggle-label"><i className="fas fa-moon" style={{ marginRight: '8px' }}></i>Dark Mode</span>
              <label className="toggle-switch">
                <input type="checkbox" checked={mode === 'dark'} onChange={() => applyMode(mode === 'dark' ? 'light' : 'dark')} />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Accent Color</h3>
            <div className="theme-grid">
              {themeOptions.map(t => (
                <div key={t.id} className={`theme-option ${theme === t.id ? 'active' : ''}`} onClick={() => applyTheme(t.id)}>
                  <div className="theme-color-dot" style={{ background: t.color }}></div>
                  <span>{t.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== ACCOUNT SETTINGS ===== */}
        {currentPage === 'accountSettings' && (
          <div className="settings-page page-container active">
            <div className="account-form">
              <div className="form-group">
                <label>Full Name</label>
                <input value={settingsName} onChange={e => setSettingsName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input value={currentUser?.email || ''} readOnly />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <div className="gender-radio-group">
                  <div className={`gender-radio ${settingsGender === 'male' ? 'selected' : ''}`} onClick={() => setSettingsGender('male')}>
                    <i className="fas fa-mars"></i> Male
                  </div>
                  <div className={`gender-radio ${settingsGender === 'female' ? 'selected' : ''}`} onClick={() => setSettingsGender('female')}>
                    <i className="fas fa-venus"></i> Female
                  </div>
                </div>
              </div>
              <button className="save-btn" onClick={handleSaveSettings}>Save Changes</button>
            </div>
          </div>
        )}

        {/* ===== MOVIE REQUEST ===== */}
        {currentPage === 'movieRequest' && (
          <div className="settings-page page-container active">
            <div className="request-form">
              <div className="form-group">
                <label>Movie / Series Name</label>
                <input value={requestName} onChange={e => setRequestName(e.target.value)} placeholder="Enter title..." />
              </div>
              <div className="form-group">
                <label>Year (Optional)</label>
                <input value={requestYear} onChange={e => setRequestYear(e.target.value)} placeholder="e.g., 2024" />
              </div>
              <button className="save-btn" onClick={handleMovieRequest}>
                <i className="fas fa-paper-plane" style={{ marginRight: '8px' }}></i>Submit Request
              </button>
            </div>
          </div>
        )}

        {/* ===== HISTORY PAGE ===== */}
        {currentPage === 'history' && (
          <HistoryPage
            allContent={allContent}
            currentUser={currentUser}
            onItemClick={(item) => {
              if (item.type === 'series') { setSeriesDetailItem(item); setSelectedSeason(getSeasons(item.episodes)[0] || 1); navigateTo('seriesDetail'); }
              else { setDetailItem(item); navigateTo('detail'); }
            }}
          />
        )}

        {/* ===== HELP PAGE ===== */}
        {currentPage === 'help' && (
          <div className="info-page page-container active">
            <h3>Frequently Asked Questions</h3>
            <p><strong>Q: How do I add movies to my watchlist?</strong><br />A: Click the + button on any movie or series detail page to add it to your watchlist.</p>
            <p><strong>Q: Can I request movies?</strong><br />A: Yes! Go to your profile and tap "Request a Movie" to submit a request.</p>
            <p><strong>Q: How do I change the app theme?</strong><br />A: Navigate to Profile → Appearance to choose from multiple color themes and toggle dark/light mode.</p>
            <p><strong>Q: Is my watch history saved?</strong><br />A: Yes, your watch history is automatically saved when you play content.</p>
            <h3 style={{ marginTop: '1.5rem' }}>Contact Us</h3>
            <p>Email: support@moviehunt.app<br />We'd love to hear from you!</p>
          </div>
        )}

        {/* ===== PRIVACY PAGE ===== */}
        {currentPage === 'privacy' && (
          <div className="info-page page-container active">
            <h3>Privacy Policy</h3>
            <p>At MOVIEHUNT, we take your privacy seriously. This policy outlines how we collect, use, and protect your personal information.</p>
            <h3>Information We Collect</h3>
            <p>We collect your email address and display name when you create an account. We also track your watch history and preferences to provide personalized recommendations.</p>
            <h3>How We Use Your Data</h3>
            <p>Your data is used solely to provide and improve our streaming service. We do not sell or share your personal information with third parties.</p>
            <h3>Data Security</h3>
            <p>All data is encrypted in transit and at rest using industry-standard security measures provided by Firebase.</p>
            <h3>Your Rights</h3>
            <p>You have the right to access, modify, or delete your personal data at any time through the Account Settings page.</p>
          </div>
        )}
      </div>

      {/* ===== BOTTOM NAVIGATION ===== */}
      {showBottomNav && (
        <nav className="bottom-nav">
          <button className={`nav-item ${currentPage === 'home' ? 'active' : ''}`} onClick={() => handleNavClick('home')}>
            <i className="fas fa-home"></i><span>Home</span>
          </button>
          <button className={`nav-item ${currentPage === 'series' ? 'active' : ''}`} onClick={() => handleNavClick('series')}>
            <i className="fas fa-tv"></i><span>Series</span>
          </button>
          <button className={`nav-item ${currentPage === 'livetv' ? 'active' : ''}`} onClick={() => handleNavClick('livetv')}>
            <i className="fas fa-satellite-dish"></i><span>Live TV</span>
          </button>
          <button className={`nav-item ${currentPage === 'watchlist' ? 'active' : ''}`} onClick={() => handleNavClick('watchlist')}>
            <i className="fas fa-bookmark"></i><span>Watchlist</span>
          </button>
          <button className={`nav-item ${currentPage === 'profile' ? 'active' : ''}`} onClick={() => handleNavClick('profile')}>
            <i className="fas fa-user"></i><span>Profile</span>
          </button>
        </nav>
      )}

      {/* ===== PLAYER ===== */}
      {showPlayer && (
        <div className="player-page">
          <div className="player-header">
            <button className="player-back-btn" onClick={() => { destroyPlayer(); setShowPlayer(false); }}>
              <i className="fas fa-arrow-left"></i>
            </button>
            <span className="player-title">
              {playerType === 'livetv' ? currentChannel?.name : playerType === 'series' ? `${playerItem?.title} - ${currentEpisode?.title || ''}` : playerItem?.title}
            </span>
            {playerType === 'livetv' && <span className="live-badge">LIVE</span>}
          </div>

          <div className="player-video-container">
            <video ref={videoRef} playsInline crossOrigin="anonymous"></video>
            {playerLoading && (
              <div className="player-loading-overlay">
                <div className="loading-spinner-ring"></div>
              </div>
            )}
            {playerError && (
              <div className="player-error-overlay">
                <i className="fas fa-exclamation-circle"></i>
                <p>Failed to load video</p>
                <button className="empty-state-btn" onClick={() => { destroyPlayer(); setShowPlayer(false); }}>Go Back</button>
              </div>
            )}
          </div>

          <div className="player-actions">
            {playerType !== 'livetv' && playerItem && (
              <>
                <button className={`player-action-item ${userInteraction === 'like' ? 'active' : ''}`} onClick={() => playerItem && handleInteraction('like', playerItem)}>
                  <i className={`fas fa-thumbs-up`}></i>
                  <span>{playerItem.likes || 0}</span>
                </button>
                <button className={`player-action-item ${userInteraction === 'dislike' ? 'active' : ''}`} onClick={() => playerItem && handleInteraction('dislike', playerItem)}>
                  <i className={`fas fa-thumbs-down`}></i>
                  <span>{playerItem.dislikes || 0}</span>
                </button>
                <button className={`player-action-item ${isInWatchlist(playerItem.id) ? 'active' : ''}`} onClick={() => playerItem && toggleWatchlist(playerItem)}>
                  <i className={`fas ${isInWatchlist(playerItem.id) ? 'fa-check' : 'fa-plus'}`}></i>
                  <span>My List</span>
                </button>
                <button className="player-action-item" onClick={() => playerItem && handleShare(playerItem)}>
                  <i className="fas fa-share"></i>
                  <span>Share</span>
                </button>
              </>
            )}
          </div>

          <div className="player-content-area">
            {playerType !== 'livetv' && playerItem && (
              <>
                <div style={{ padding: '0.8rem 1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{playerItem.title}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.3rem 0' }}>
                    {playerItem.year} · {playerItem.category} · {playerItem.type === 'series' ? 'Series' : 'Movie'}
                  </p>
                  {playerItem.storyline && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{playerItem.storyline}</p>
                  )}
                </div>

                {/* Series episodes in player */}
                {playerType === 'series' && playerItem.episodes && (
                  <div style={{ padding: '0 0rem' }}>
                    <div className="section-header"><span className="section-title">Episodes</span></div>
                    {getEpisodesBySeason(playerItem.episodes, currentEpisode?.season || 1).map((ep: any, i: number) => (
                      <div key={i} className="episode-card" onClick={() => {
                        setCurrentEpisode(ep);
                        setPlayerLoading(true);
                        setPlayerError(false);
                        if (ep.link) initPlayer(ep.link);
                      }} style={{ background: ep.episode === currentEpisode?.episode ? 'var(--card-bg-hover)' : 'var(--card-bg)' }}>
                        <div className="episode-thumb">
                          <img src={ep.thumbnail || playerItem.poster} alt={ep.title} onError={(e) => { (e.target as HTMLImageElement).src = playerItem.poster; }} />
                        </div>
                        <div className="episode-info">
                          <span className="episode-number">S{ep.season} · E{ep.episode}</span>
                          <span className="episode-title">{ep.title || `Episode ${ep.episode}`}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* More Like This */}
                <div style={{ marginTop: '1rem' }}>
                  <div className="section-header"><span className="section-title">More Like This</span></div>
                  <div className="content-slider">
                    {getSimilarContent(playerItem).map(item => (
                      <div key={item.id} className="content-card" onClick={() => {
                        if (item.type === 'movie') {
                          setPlayerItem(item);
                          setPlayerLoading(true);
                          setPlayerError(false);
                          addToWatchHistory(item);
                          if (item.link) setTimeout(() => initPlayer(item.link!), 50);
                        } else {
                          destroyPlayer();
                          setShowPlayer(false);
                          setSeriesDetailItem(item);
                          setSelectedSeason(getSeasons(item.episodes)[0] || 1);
                          setCurrentPage('seriesDetail');
                        }
                      }}>
                        <div className="content-card-poster">
                          <img src={item.poster} alt={item.title} loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450/1a1a2e/666?text=No+Image'; }} />
                          <div className="content-card-overlay">
                            <div className="content-card-title">{item.title}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== TRAILER MODAL ===== */}
      {showTrailer && (
        <div className="trailer-modal">
          <button className="trailer-close" onClick={() => setShowTrailer(false)}>
            <i className="fas fa-times"></i>
          </button>
          <iframe className="trailer-iframe" src={trailerUrl} allow="autoplay; encrypted-media" allowFullScreen title="Trailer"></iframe>
        </div>
      )}

      {/* ===== GENDER MODAL ===== */}
      {showGenderModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <span className="modal-title">{onboardingFlow ? 'Welcome! Choose your gender' : 'Select Gender'}</span>
              {!onboardingFlow && <button className="modal-close" onClick={() => setShowGenderModal(false)}><i className="fas fa-times"></i></button>}
            </div>
            <div className="gender-choice-grid">
              <button className="gender-choice-btn" onClick={() => handleGenderSelect('male')}>
                <i className="fas fa-mars"></i><span>Male</span>
              </button>
              <button className="gender-choice-btn" onClick={() => handleGenderSelect('female')}>
                <i className="fas fa-venus"></i><span>Female</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== AVATAR MODAL ===== */}
      {showAvatarModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <span className="modal-title">Choose Your Avatar</span>
            </div>
            <div className="avatar-grid">
              {(selectedGender === 'male' ? MALE_AVATARS : FEMALE_AVATARS).map((url, i) => (
                <div key={i} className={`avatar-option ${selectedAvatar === url ? 'selected' : ''}`} onClick={() => {
                  setSelectedAvatar(url);
                  if (onboardingFlow) handleAvatarSelect(url);
                  else handleProfileAvatarSelect(url);
                }}>
                  <img src={url} alt={`Avatar ${i + 1}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== TOAST ===== */}
      {toastVisible && (
        <div className="toast-container">
          <div className="toast">{toastMsg}</div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// HISTORY PAGE COMPONENT
// ============================================================

function HistoryPage({ allContent, currentUser, onItemClick }: {
  allContent: ContentItem[];
  currentUser: any;
  onItemClick: (item: ContentItem) => void;
}) {
  const [historyItems, setHistoryItems] = useState<ContentItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    const db = getDatabase();
    const user = currentUser;
    if (!db || !user) {
      setHistoryLoading(false);
      return;
    }
    db.ref(`watch_history/${user.uid}`).orderByChild('timestamp').once('value', (snap: any) => {
      const data = snap.val();
      if (data) {
        const items: ContentItem[] = [];
        Object.keys(data).forEach(key => {
          const found = allContent.find(c => c.id === key);
          if (found) items.push(found);
        });
        setHistoryItems(items.reverse());
      }
      setHistoryLoading(false);
    });
  }, [allContent, currentUser]);

  if (historyLoading) {
    return (
      <div className="history-page page-container active">
        <div className="empty-state">
          <div className="loading-spinner-ring"></div>
          <p style={{ marginTop: '1rem' }}>Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page page-container active">
      {historyItems.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-history"></i>
          <h3>No Watch History</h3>
          <p>Start watching to see your history here</p>
        </div>
      ) : (
        historyItems.map(item => (
          <div key={item.id} className="watchlist-card" onClick={() => onItemClick(item)}>
            <div className="watchlist-poster">
              <img src={item.poster} alt={item.title} onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450/1a1a2e/666?text=No+Image'; }} />
            </div>
            <div className="watchlist-info">
              <div className="watchlist-title">{item.title}</div>
              <div className="watchlist-meta">{item.year} · {item.category} · {item.type === 'series' ? 'Series' : 'Movie'}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
