'use client';
import { memo } from 'react';
import type { SpotifyBlock } from '@/app/features/types';

/** Renders a Spotify embed — compact height for tracks, full height for albums/playlists/episodes. */
function SpotifyEmbed({ block }: { block: SpotifyBlock }) {
  const isTrack = block.spotifyType === 'track';
  const height = isTrack ? 80 : 380;

  return (
    <div className="w-[320px]" style={{ height }}>
      <div className="relative w-full h-full">
        <iframe
          className="w-full h-full border-0 block rounded-xl"
          src={`https://open.spotify.com/embed/${block.spotifyType}/${block.spotifyId}?utm_source=generator`}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title={`Spotify ${block.spotifyType}`}
        />
        {/* Blocks iframe from stealing mouse events */}
        <div className="absolute inset-0" />
      </div>
    </div>
  );
}

export default memo(SpotifyEmbed);
