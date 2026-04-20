import type { ParcelType, CardCategory, ResourceKey, ScoreKey } from "@/lib/game/types";

/**
 * SVG icon library for the game.
 *
 * Each parcel type has a tiny silhouette drawn at a 24x24 viewBox so it
 * scales cleanly at any tile size. Resource icons, score icons, and card
 * category icons live here too. All SVGs use currentColor so parents can
 * restyle via text color.
 */

interface IconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

/* ================================================================== */
/*  Parcel building silhouettes                                        */
/* ================================================================== */

export function ParcelIcon({ type, className = "", size = 16 }: { type: ParcelType; className?: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "currentColor", className };
  switch (type) {
    case "vacant":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="6" cy="12" r="1" />
          <circle cx="12" cy="12" r="1" />
          <circle cx="18" cy="12" r="1" />
        </svg>
      );
    case "single-family":
      return (
        <svg {...common}>
          <path d="M12 3L4 10v11h5v-6h6v6h5V10z" />
        </svg>
      );
    case "two-flat":
      return (
        <svg {...common}>
          <path d="M12 3L3 10v11h18V10z M8 14h3v4H8zm5 0h3v4h-3z" />
        </svg>
      );
    case "three-flat":
      return (
        <svg {...common}>
          <rect x="4" y="6" width="16" height="16" />
          <path fill="#F5F0E8" d="M7 9h3v3H7zm7 0h3v3h-3zM7 14h3v3H7zm7 0h3v3h-3zM7 19h3v3H7zm7 0h3v3h-3z" />
        </svg>
      );
    case "courtyard":
      return (
        <svg {...common}>
          <path d="M3 6h18v15H3z" />
          <path fill="#F5F0E8" d="M10 14h4v7h-4z M6 9h3v3H6zm9 0h3v3h-3zM6 15h3v3H6zm9 0h3v3h-3z" />
        </svg>
      );
    case "tower":
      return (
        <svg {...common}>
          <rect x="6" y="2" width="12" height="20" />
          <path fill="#F5F0E8" d="M8 5h2v2H8zm4 0h2v2h-2zm4 0h2v2h-2zM8 10h2v2H8zm4 0h2v2h-2zm4 0h2v2h-2zM8 15h2v2H8zm4 0h2v2h-2zm4 0h2v2h-2zm-8 5h2v2H8z" />
        </svg>
      );
    case "rehab-tower":
      return (
        <svg {...common}>
          <rect x="6" y="4" width="12" height="18" />
          <circle cx="12" cy="2" r="2" fill="currentColor" />
          <path fill="#F5F0E8" d="M8 7h8v2H8zm0 4h8v2H8zm0 4h8v2H8z" />
        </svg>
      );
    case "commercial":
      return (
        <svg {...common}>
          <path d="M3 9V7l2-4h14l2 4v2l-2 2H5zM5 13v7h5v-5h4v5h5v-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case "industrial":
      return (
        <svg {...common}>
          <path d="M3 21V9l6 3V9l6 3V6h3l3 3v12z" />
          <path fill="#F5F0E8" d="M5 17h2v2H5zm4 0h2v2H9zm4 0h2v2h-2zm4 0h2v2h-2z" />
        </svg>
      );
    case "school":
      return (
        <svg {...common}>
          <path d="M12 2L2 7v2h20V7z M4 10v10h16V10z" />
          <path fill="#F5F0E8" d="M9 13h6v7H9z" />
        </svg>
      );
    case "church":
      return (
        <svg {...common}>
          <path d="M12 2v4M10 4h4M6 22V10l6-3 6 3v12z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M10 17h4v5h-4z" />
        </svg>
      );
    case "park":
      return (
        <svg {...common}>
          <circle cx="12" cy="9" r="5" />
          <path d="M10 13h4v9h-4z" />
          <circle cx="6" cy="15" r="3" />
          <circle cx="18" cy="15" r="3" />
        </svg>
      );
    case "transit":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="14" rx="3" />
          <path fill="#F5F0E8" d="M6 7h5v4H6zm7 0h5v4h-5z" />
          <circle fill="#F5F0E8" cx="8" cy="15" r="1.2" />
          <circle fill="#F5F0E8" cx="16" cy="15" r="1.2" />
          <path d="M7 19l-2 3h3l1-2M17 19l2 3h-3l-1-2" />
        </svg>
      );
    case "expressway":
      return (
        <svg {...common}>
          <path d="M0 8h24v8H0z" />
          <path fill="#F5F0E8" d="M2 11h3v2H2zm5 0h3v2H7zm5 0h3v2h-3zm5 0h3v2h-3z" />
        </svg>
      );
    case "land-trust":
      return (
        <svg {...common}>
          <path d="M12 2l9 5v10l-9 5-9-5V7z" />
          <path fill="#F5F0E8" d="M12 7l-5 3v5l5 3 5-3v-5z M10 12h4v3h-4z" />
        </svg>
      );
    case "demolished":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 20h16M5 16l5-10 4 8 5-4M8 14L6 20m4-10l2 10m2-6l1 6" />
        </svg>
      );
    case "mural":
      return (
        <svg {...common}>
          <rect x="2" y="4" width="20" height="16" rx="1" />
          <path fill="#F5F0E8" d="M5 8c2-2 4-2 6 0s4 2 6 0 4-2 4 0v8H5z" />
          <circle fill="currentColor" cx="9" cy="10" r="1" />
          <circle fill="currentColor" cx="15" cy="11" r="1" />
        </svg>
      );
    case "community-garden":
      return (
        <svg {...common}>
          <circle cx="7" cy="10" r="3" />
          <circle cx="17" cy="10" r="3" />
          <circle cx="12" cy="6" r="3" />
          <path d="M11 13h2v9h-2zM6 13h2v9H6zm10 0h2v9h-2z" />
        </svg>
      );
    case "library":
      return (
        <svg {...common}>
          <path d="M3 4h8v16H3zm10 0h8v16h-8z" />
          <path fill="#F5F0E8" d="M5 6h4v1H5zm0 3h4v1H5zm0 3h4v1H5zm10-6h4v1h-4zm0 3h4v1h-4zm0 3h4v1h-4z" />
        </svg>
      );
    case "clinic":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="1" />
          <path fill="#F5F0E8" d="M10 9h4v3h3v4h-3v3h-4v-3H7v-4h3z" />
        </svg>
      );
    default:
      return null;
  }
}

/* ================================================================== */
/*  Resource icons                                                     */
/* ================================================================== */

export function ResourceIcon({ resource, className = "", size = 16 }: { resource: ResourceKey; className?: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "currentColor", className };
  switch (resource) {
    case "capital":
      // Coin stack
      return (
        <svg {...common}>
          <ellipse cx="12" cy="6" rx="8" ry="3" />
          <path d="M4 6v4c0 1.66 3.58 3 8 3s8-1.34 8-3V6" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M4 10v4c0 1.66 3.58 3 8 3s8-1.34 8-3v-4" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M4 14v4c0 1.66 3.58 3 8 3s8-1.34 8-3v-4" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case "power":
      // Raised fist / column
      return (
        <svg {...common}>
          <path d="M8 2h2v6H8zm3 1h2v5h-2zm3 1h2v4h-2zm3 1h2v3h-2zM6 8h14v3H6zM8 11c0 3 1 10 4 11h4c3-1 4-8 4-11z" />
        </svg>
      );
    case "trust":
      // Handshake
      return (
        <svg {...common}>
          <path d="M2 10l5-5 2 2-1 1 3 3 4-4-1-1 2-2 5 5v3l-3 3-4-4-3 3 1 1-3 3-5-5z" />
        </svg>
      );
    case "knowledge":
      // Open book
      return (
        <svg {...common}>
          <path d="M2 5h9c1.5 0 2 .5 2 2v13c0-1-.5-2-2-2H2zm20 0h-9c-1.5 0-2 .5-2 2v13c0-1 .5-2 2-2h9z" />
          <path fill="#F5F0E8" d="M4 8h6v1H4zm0 3h6v1H4zm0 3h6v1H4zm10-6h6v1h-6zm0 3h6v1h-6zm0 3h6v1h-6z" />
        </svg>
      );
  }
}

/* ================================================================== */
/*  Score axis icons                                                   */
/* ================================================================== */

export function ScoreIcon({ score, className = "", size = 16 }: { score: ScoreKey; className?: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "currentColor", className };
  switch (score) {
    case "equity":
      // Balance scale
      return (
        <svg {...common}>
          <path d="M12 2v20M4 8l4-4 4 4M20 8l-4-4-4 4M2 14h10L7 6l-5 8zm20 0H12l5-8 5 8z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case "heritage":
      // Column / monument
      return (
        <svg {...common}>
          <path d="M4 4h16v3H4zM6 8h2v11H6zm4 0h2v11h-2zm4 0h2v11h-2zm4 0h2v11h-2zM3 20h18v2H3z" />
        </svg>
      );
    case "growth":
      // Bar chart rising
      return (
        <svg {...common}>
          <path d="M3 21V13h4v8zm6 0V9h4v12zm6 0V5h4v16z" />
        </svg>
      );
    case "sustainability":
      // Leaf
      return (
        <svg {...common}>
          <path d="M4 20c4-12 12-16 18-16-1 10-5 18-15 18-2 0-3-1-3-2m3 0c2-4 6-9 12-13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
  }
}

/* ================================================================== */
/*  Card category icons                                                */
/* ================================================================== */

export function CategoryIcon({ category, className = "", size = 14 }: { category: CardCategory; className?: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "currentColor", className };
  switch (category) {
    case "zoning":
      return <svg {...common}><path d="M3 3h8v8H3zm10 0h8v5h-8zm0 7h8v11h-8zM3 13h8v8H3z" /></svg>;
    case "finance":
      return <svg {...common}><path d="M12 2l2 5h5l-4 3 1 6-5-3-5 3 1-6-4-3h5z" /></svg>;
    case "infrastructure":
      return <svg {...common}><path d="M4 18l8-14 8 14zm2 3h12v-2H6z" /></svg>;
    case "housing":
      return <svg {...common}><path d="M12 3L2 12h3v9h5v-6h4v6h5v-9h3z" /></svg>;
    case "schools":
      return <svg {...common}><path d="M12 3L1 9l11 6 9-4.9V17h2V9zM5 14.1v4L12 22l7-3.9v-4L12 18z" /></svg>;
    case "organizing":
      // Raised fist
      return <svg {...common}><path d="M10 2h2v5h-2zm3 1h2v4h-2zm3 1h2v3h-2zM7 3h2v4H7zM5 8h14v3H5zm2 3c0 3 1 10 4 11h4c3-1 4-8 4-11z" /></svg>;
    case "research":
      // Magnifying glass
      return <svg {...common}><circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" strokeWidth="3" /><path d="M14 14l7 7" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" /></svg>;
    case "transit":
      return <svg {...common}><rect x="4" y="4" width="16" height="14" rx="3" /><path fill="#F5F0E8" d="M6 7h5v4H6zm7 0h5v4h-5z" /><circle fill="#F5F0E8" cx="8" cy="15" r="1.2" /><circle fill="#F5F0E8" cx="16" cy="15" r="1.2" /></svg>;
    case "preservation":
      return <svg {...common}><path d="M6 10v-4a6 6 0 1112 0v4M4 10h16v12H4z" fill="none" stroke="currentColor" strokeWidth="2" /></svg>;
    case "commerce":
      return <svg {...common}><path d="M3 3h18v4H3zm2 6h14l-1 11H6zM9 12v5h2v-5zm4 0v5h2v-5z" /></svg>;
    case "environment":
      return <svg {...common}><path d="M12 2c-4 0-6 3-6 6 0 3 2 6 6 6s6-3 6-6-2-6-6-6m0 10v10" fill="none" stroke="currentColor" strokeWidth="2" /></svg>;
    case "culture":
      // Musical note/arts
      return <svg {...common}><path d="M9 3v14c-1-1-2-1-3-1-2 0-3 1-3 3s1 3 3 3 3-1 3-3V7h10V3z" /></svg>;
  }
}

/* ================================================================== */
/*  Generic UI icons                                                   */
/* ================================================================== */

export function ChevronRight({ className = "", size = 16 }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6" /></svg>;
}

export function Lock({ className = "", size = 16 }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 10V7a6 6 0 1112 0v3h1a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9a2 2 0 012-2zm2 0h8V7a4 4 0 10-8 0z" /></svg>;
}

export function Trophy({ className = "", size = 16 }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M7 2h10v5a5 5 0 01-10 0zM3 4h2v4a4 4 0 008 0V4M21 4h-2v4a4 4 0 01-8 0V4M10 14h4v4h-4zM7 19h10v3H7z" /></svg>;
}

export function Compass({ className = "", size = 16 }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" /></svg>;
}

export function Sparkles({ className = "", size = 16 }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 2l2.5 5L20 9.5 14.5 12 12 17 9.5 12 4 9.5 9.5 7zM5 17l1 2 2 1-2 1-1 2-1-2-2-1 2-1zm14 0l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" /></svg>;
}
