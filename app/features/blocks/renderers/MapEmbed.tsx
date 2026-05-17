'use client';
import type { MapBlock } from '@/app/features/types';

/** Renders a Google Maps embed iframe from a pre-validated embed URL. */
export default function MapEmbed({ block }: { block: MapBlock }) {
  return (
    <div className="w-[400px] h-[300px]">
      <div className="relative w-full h-full">
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
      </div>
    </div>
  );
}
