export interface Comment {
  id: string;
  text: string;
  createdAt: number;
  authorId?: string;
  authorName?: string;
  authorColor?: string;
  replies?: Comment[];
}

export interface BaseBlock {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  comments?: Comment[];
  pinned?: boolean;
  /** Stored parent frame id. `undefined` = pre-migration (backfilled from geometry on load); `null` = intentionally top-level (never re-derived); a string = intentionally nested. */
  parentFrameId?: string | null;
}

export interface LinkBlock extends BaseBlock {
  type: 'link';
  url: string;
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  loading?: boolean;
}

export interface YouTubeBlock extends BaseBlock {
  type: 'youtube';
  videoId: string;
  title?: string;
}

export interface TwitterBlock extends BaseBlock {
  type: 'twitter';
  tweetId: string;
  url: string;
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  url: string;
  alt?: string;
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  content: string;
}

export interface PdfBlock extends BaseBlock {
  type: 'pdf';
  url: string;
  title?: string;
}

export interface SpotifyBlock extends BaseBlock {
  type: 'spotify';
  spotifyType: 'track' | 'album' | 'playlist' | 'episode';
  spotifyId: string;
  url: string;
}

export interface MapBlock extends BaseBlock {
  type: 'map';
  embedUrl: string;
  title?: string;
}

export interface GitHubBlock extends BaseBlock {
  type: 'github';
  owner: string;
  repo: string;
  url: string;
  description?: string;
  stars?: number;
  forks?: number;
  language?: string;
  license?: string;
  topics?: string[];
  loading?: boolean;
}

export type Block = LinkBlock | YouTubeBlock | TwitterBlock | ImageBlock | TextBlock | PdfBlock | SpotifyBlock | MapBlock | GitHubBlock;

export type AlignMode = 'distributeH' | 'distributeV';

/** The side of a block an edge connection can start from. */
export type ConnectorSide = 'top' | 'right' | 'bottom' | 'left';

/** Line rendering style for a connector. 'wide' is a dashed line with larger gaps. Defaults to 'solid'. */
export type ConnectorStyle = 'solid' | 'dashed' | 'wide';

/** A directed arrow linking two blocks. Endpoints auto-route to the nearest facing edges. */
export interface Connector {
  id: string;
  sourceId: string;
  targetId: string;
  /** CSS colour of the line and arrowhead; defaults to STROKE_COLOR when unset. */
  color?: string;
  /** Line style; defaults to 'solid' when unset. */
  style?: ConnectorStyle;
  /** Signed perpendicular offset (world units) of the curve's belly from its un-bent midpoint; 0/unset is a plain auto-routed curve. */
  curvature?: number;
}

export interface RemotePresencePeer {
  id: string;
  /** Stable user id (or per-session guest id) — used to dedupe multiple tabs/devices of one person. */
  userId: string;
  name: string;
  color: string;
  cursor: { x: number; y: number } | null;
  selection: { blockIds: string[]; frameId: string | null };
  typing: boolean;
  viewport: { offset: { x: number; y: number }; scale: number; size: { w: number; h: number } } | null;
}

export type FrameColor = 'slate' | 'blue' | 'green' | 'amber' | 'rose' | 'violet';

export interface Frame {
  id: string;
  title: string;
  color: FrameColor;
  x: number;
  y: number;
  width: number;
  height: number;
  collapsed: boolean;
  /** Stored parent frame id. `undefined` = pre-migration (backfilled from geometry on load); `null` = intentionally top-level (never re-derived); a string = intentionally nested. */
  parentFrameId?: string | null;
  comments?: Comment[];
}
