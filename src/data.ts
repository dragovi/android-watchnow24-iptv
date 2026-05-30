import { IptvChannel, VpnNode } from "./types";

export const DEMO_ACCOUNT_INFO = {
  username: "WATCHNOW24_PREMIUM_USER",
  serverUrl: "http://premium.watchnow24.com:8080",
  status: "Active" as const,
  expiryDate: "2027-12-31T23:59:59.000Z",
  maxConnections: 4,
  activeConnections: 1,
};

export const DEMO_CHANNELS: IptvChannel[] = [
  // --- LIVE TV CHANNELS ---
  {
    id: "news_hq",
    name: "NASA HD Live Space News",
    logo: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=200&h=200&fit=crop",
    url: "https://ntv1.akamaized.net/hls/live/2014088/NASA-NTV1-A/master.m3u8",
    group: "Live TV - News & Global",
    number: "101",
    epgId: "news_hq",
    streamType: "live",
    description: "Official NASA TV Live broadcast covering space exploration, direct ISS feeds, launching missions, and high-fidelity planetary reports."
  },
  {
    id: "nasa_space",
    name: "ISS Space Station Orbit Feed",
    logo: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?q=80&w=200&h=200&fit=crop",
    url: "https://playertest.longtailvideo.com/adaptive/oceans/oceans.m3u8",
    group: "Live TV - News & Global",
    number: "102",
    epgId: "nasa_space",
    streamType: "live",
    description: "Streaming direct view from the International Space Station overlooking planet earth with atmospheric updates."
  },
  {
    id: "movies_gold",
    name: "CineGold Classics HD",
    logo: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=200&h=200&fit=crop",
    url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    group: "Live TV - Cinema & Entertainment",
    number: "201",
    epgId: "movies_gold",
    streamType: "live",
    description: "Premium cinematic stream broadcasting selected legendary blockbusters, retro gold selections, and cinematic previews."
  },
  {
    id: "sports_pro",
    name: "RedBull Racing & Action Live",
    logo: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=200&h=200&fit=crop",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
    group: "Live TV - Sports & Extreme",
    number: "301",
    epgId: "sports_pro",
    streamType: "live",
    description: "Adrenaline fueling live sports, extreme trials, speed rallies, mountain bike highlights, and motorsport championships worldwide."
  },
  {
    id: "series_premium",
    name: "Premium HBO Series Loop",
    logo: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=200&h=200&fit=crop",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    group: "Live TV - Cinema & Entertainment",
    number: "202",
    epgId: "series_premium",
    streamType: "live",
    description: "High-definition streaming loop of premium television series, showcasing outstanding screenplay and narrative designs."
  },
  {
    id: "nature_wild",
    name: "National Wild & Oceans Explorer",
    logo: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=200&h=200&fit=crop",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
    group: "Live TV - Nature & Science",
    number: "401",
    epgId: "nature_wild",
    streamType: "live",
    description: "A continuous visual safari of modern environmental discoveries, coral reef depths, active volcanoes, and animal habitats."
  },

  // --- MOVIES / VOD ---
  {
    id: "vod_sintel",
    name: "Sintel (Ultra HD)",
    logo: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=500&h=700&fit=crop",
    backdrop: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1200&fit=crop",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    group: "VOD - Sci-Fi & Adventure",
    streamType: "movie",
    year: "2020",
    rating: "9.2/10",
    duration: "14 min",
    director: "Colin Levy",
    cast: "Halina Reijn, Jerry Hendriks",
    description: "A beautiful, emotionally charged cinematic quest where a lone female warrior, Sintel, searches for her lost baby dragon, confronting her own memories and old dragons alike."
  },
  {
    id: "vod_bbb",
    name: "Big Buck Bunny",
    logo: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=500&h=700&fit=crop",
    backdrop: "https://images.unsplash.com/photo-1500627869374-13cd993b1115?q=80&w=1200&fit=crop",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    group: "VOD - Comedy & Animation",
    streamType: "movie",
    year: "2018",
    rating: "8.5/10",
    duration: "10 min",
    director: "Sacha Goedegebure",
    cast: "Animated Creatures",
    description: "A massive, friendly forest rabbit takes delightful comedic revenge on three cheeky woodland rodents that crossed his boundaries. Crafted entirely with open tools."
  },
  {
    id: "vod_tears",
    name: "Tears of Steel (Sci-Fi Edition)",
    logo: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=500&h=700&fit=crop",
    backdrop: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&fit=crop",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    group: "VOD - Sci-Fi & Adventure",
    streamType: "movie",
    year: "2019",
    rating: "9.0/10",
    duration: "12 min",
    director: "Ian Hubert",
    cast: "Derek de Lint, Sergio Hasselbaink",
    description: "Set in a high-tech dystopian Amsterdam, a group of scientists attempts to prevent global robot destruction by recreating an intense romantic encounter from their youthful past."
  },
  {
    id: "vod_elephants",
    name: "Elephant's Dream",
    logo: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&h=700&fit=crop",
    backdrop: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&fit=crop",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    group: "VOD - Surrealist Drama",
    streamType: "movie",
    year: "2012",
    rating: "7.8/10",
    duration: "11 min",
    director: "Bassam Kurdali",
    cast: "Tygo Gernandt, Cas Jansen",
    description: "An incredible industrial fantasy following the logic of a massive typing mechanism, representing recursive relationships in mechanical dreamworlds."
  },

  // --- SERIES ---
  {
    id: "series_cosmos",
    name: "Cosmic Infinity: Sci-Fi Chronicle",
    logo: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=500&h=700&fit=crop",
    backdrop: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1200&fit=crop",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    group: "Series - Intergalactic Travel",
    streamType: "series",
    year: "2023",
    rating: "9.5/10",
    description: "An epic episodic series charting human travel to exotic star systems across the Sagittarius spiral arm.",
    seasons: [
      {
        seasonNumber: 1,
        episodes: [
          {
            id: "cosmos_s1_e1",
            episodeNumber: 1,
            title: "Genesis of Alpha Centauri",
            url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            duration: "8 min",
            description: "The crew boards the Star-Vessel WATCH24 and makes the first warp jump outside solar solar system lines."
          },
          {
            id: "cosmos_s1_e2",
            episodeNumber: 2,
            title: "The Cryo-Chamber Paradox",
            url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
            duration: "14 min",
            description: "A malfunction inside wake pods triggers a temporal recursion where engineers awake in nested realities."
          },
          {
            id: "cosmos_s1_e3",
            episodeNumber: 3,
            title: "Tears in Orbit",
            url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
            duration: "12 min",
            description: "Encountering a deep relic from earth's cybernetic age, the crew fights to override automated weapons."
          }
        ]
      },
      {
        seasonNumber: 2,
        episodes: [
          {
            id: "cosmos_s2_e1",
            episodeNumber: 1,
            title: "Chronos Portal",
            url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            duration: "11 min",
            description: "Stepping inside the gravity singularity, the commander finds an endless mechanical writing hall."
          }
        ]
      }
    ]
  },
  {
    id: "series_motors",
    name: "Speed & Gravel: GT Chronicles",
    logo: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=500&h=700&fit=crop",
    backdrop: "https://images.unsplash.com/photo-1547949003-9792a18a2601?q=80&w=1200&fit=crop",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
    group: "Series - Sports & Automotive",
    streamType: "series",
    year: "2024",
    rating: "8.9/10",
    description: "A fast paced docu-series tracking professional supercars through dangerous dirt paths and urban racing tournaments.",
    seasons: [
      {
        seasonNumber: 1,
        episodes: [
          {
            id: "sg_s1_e1",
            episodeNumber: 1,
            title: "Rally on the Alps Borders",
            url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
            duration: "5 min",
            description: "Drivers face unpredictable ice patches and critical altitude drops during the Swiss prologue."
          },
          {
            id: "sg_s1_e2",
            episodeNumber: 2,
            title: "Golden Hour Exhausts",
            url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
            duration: "4 min",
            description: "Fine tuning high performance engines to perform under desert heat loops while testing hypercar aerodynamics."
          }
        ]
      }
    ]
  }
];

export const DEMO_VPN_NODES: VpnNode[] = [
  { id: "node_fr", country: "France", city: "Paris (Premium)", flag: "🇫🇷", ip: "194.254.120.31", ping: 14, load: 38, premium: false },
  { id: "node_us", country: "United States", city: "Miami High-Speed", flag: "🇺🇸", ip: "104.28.16.85", ping: 85, load: 42, premium: false },
  { id: "node_de", country: "Germany", city: "Frankfurt Pro", flag: "🇩🇪", ip: "46.165.2.14", ping: 22, load: 19, premium: false },
  { id: "node_ca", country: "Canada", city: "Montreal Edge", flag: "🇨🇦", ip: "198.50.150.84", ping: 92, load: 55, premium: false },
  { id: "node_sg", country: "Singapore", city: "Marina Bay Ultra", flag: "🇸🇬", ip: "103.242.116.1", ping: 195, load: 74, premium: true },
  { id: "node_ch", country: "Switzerland", city: "Zurich Swiss Shield", flag: "🇨🇭", ip: "179.43.151.27", ping: 28, load: 12, premium: true },
];
