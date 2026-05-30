'use client';
import { memo } from 'react';
import type { CSSProperties } from 'react';
import type { Block, Frame, RemotePresencePeer } from '@/app/features/types';
import BlockContainer from '../blocks/Block';
import FrameView from '../frames/Frame';
import type { BlockHandlers } from '../blocks/types';
import type { FrameHandlers, FrameRenameRequest, Rect } from '../frames/types';
import { PeerSelections } from './PeerLayer';

interface DragHover {
  hoverFrameId: string | null;
  previewByFrame: Map<string, Rect>;
}

interface FrameLayer {
  visibleFrames: Frame[];
  framePresent: Map<string, { count: number; descBlocks: Block[] }>;
  dragHover: DragHover | null;
  selectedFrameId: string | null;
  handlers: FrameHandlers;
  renameRequest: FrameRenameRequest | null;
}

interface BlockLayer {
  visibleBlocks: Block[];
  selectedIds: Set<string>;
  handlers: BlockHandlers;
}

interface PeerLayerProps {
  peers: RemotePresencePeer[];
  blockById: Map<string, Block>;
  frameById: Map<string, Frame>;
}

interface Props {
  offset: { x: number; y: number };
  scale: number;
  frameLayer: FrameLayer;
  blockLayer: BlockLayer;
  peerLayer: PeerLayerProps;
}

const WORLD_BASE_STYLE: CSSProperties = { transformOrigin: '0 0', willChange: 'transform' };

/** The transformed world: frames (outer→inner), blocks, and peer selection outlines. */
function CanvasWorld({ offset, scale, frameLayer, blockLayer, peerLayer }: Props) {
  const { visibleFrames, framePresent, dragHover, selectedFrameId, handlers: frameHandlers, renameRequest } = frameLayer;
  const { visibleBlocks, selectedIds, handlers: blockHandlers } = blockLayer;

  return (
    <div
      className="absolute"
      style={{ ...WORLD_BASE_STYLE, transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
    >
      {/* Frames (behind blocks, sorted outer→inner) */}
      {visibleFrames.map(frame => {
        const present = framePresent.get(frame.id);
        const isHover = dragHover?.hoverFrameId === frame.id;
        const previewRect = dragHover?.previewByFrame.get(frame.id);
        const dropPreview = isHover
          ? { active: true, rect: previewRect }
          : previewRect
            ? { active: false, rect: previewRect }
            : undefined;
        return (
          <FrameView
            key={frame.id}
            frame={frame}
            scale={scale}
            selected={selectedFrameId === frame.id}
            memberCount={present?.count ?? 0}
            descendantBlocks={present?.descBlocks ?? []}
            handlers={frameHandlers}
            dropPreview={dropPreview}
            renameRequest={renameRequest}
          />
        );
      })}

      {/* Blocks (skip those inside a collapsed frame) */}
      {visibleBlocks.map(block => (
        <BlockContainer
          key={block.id}
          block={block}
          scale={scale}
          selected={selectedIds.has(block.id)}
          isInMultiSelection={selectedIds.size > 1 && selectedIds.has(block.id)}
          handlers={blockHandlers}
        />
      ))}

      {/* Remote peer selection outlines (canvas-space, scale-correct) */}
      <PeerSelections peers={peerLayer.peers} blockById={peerLayer.blockById} frameById={peerLayer.frameById} />
    </div>
  );
}

export default memo(CanvasWorld);
