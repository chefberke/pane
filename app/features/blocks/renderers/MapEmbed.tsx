'use client';
import { memo } from 'react';
import { MapPin } from 'lucide-react';
import type { MapBlock } from '@/app/features/types';
import EmbedPlaceholder from './EmbedPlaceholder';

/** Renders a Google Maps embed iframe from a pre-validated embed URL, or a placeholder when far offscreen. */
function MapEmbed({ block, active }: { block: MapBlock; active: boolean }) {
  return (
    <div className="w-[400px] h-[300px]">
      <div className="relative w-full h-full">
        {active ? (
          <>
            <iframe
              className="w-full h-full border-0 block"
              src={block.embedUrl}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={block.title ?? 'Map'}
            />
            {/* Blocks iframe from stealing mouse events */}
            <div className="absolute inset-0" />
          </>
        ) : (
          <EmbedPlaceholder icon={<MapPin size={22} />} label="Map" />
        )}
      </div>
    </div>
  );
}

export default memo(MapEmbed);
