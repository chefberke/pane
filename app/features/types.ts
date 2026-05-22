export interface Comment {
  id: string;
  text: string;
  createdAt: number;
}

export interface BaseBlock {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  comments?: Comment[];
  pinned?: boolean;
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
  source: 'url' | 'upload';
  filePath?: string;
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

export interface RemotePresencePeer {
  id: string;
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
  parentFrameId?: string;
  comments?: Comment[];
}
