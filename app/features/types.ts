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

export type Block = LinkBlock | YouTubeBlock | TwitterBlock | ImageBlock | TextBlock;

export type AlignMode = 'distributeH' | 'distributeV';
