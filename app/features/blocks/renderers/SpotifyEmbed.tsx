'use client';
import { memo } from 'react';
import { Music } from 'lucide-react';
import type { SpotifyBlock } from '@/app/features/types';
import EmbedPlaceholder from './EmbedPlaceholder';

/** Renders a Spotify embed — compact for tracks, full for albums/playlists/episodes — or a placeholder when far offscreen. */
function SpotifyEmbed({ block, active }: { block: SpotifyBlock; active: boolean }) {
  const isTrack = block.spotifyType === 'track';
  const height = isTrack ? 80 : 380;

  return (
    <div className="w-[320px]" style={{ height }}>
      <div className="relative w-full h-full">
        {active ? (
          <>
            <iframe
              className="w-full h-full border-0 block rounded-xl"
              src={`https://open.spotify.com/embed/${block.spotifyType}/${block.spotifyId}?utm_source=generator`}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title={`Spotify ${block.spotifyType}`}
            />
            {/* Blocks iframe from stealing mouse events */}
            <div className="absolute inset-0" />
          </>
        ) : (
          <EmbedPlaceholder icon={<Music size={22} />} label="Spotify" />
        )}
      </div>
    </div>
  );
}

export default memo(SpotifyEmbed);
