'use client';
import { memo } from 'react';
import type { CSSProperties } from 'react';
import type { Block, Frame, Connector, RemotePresencePeer } from '@/app/features/types';
import BlockContainer from '../blocks/Block';
import FrameView from '../frames/Frame';
import Connectors from '../connectors/Connectors';
import type { BlockHandlers } from '../blocks/types';
import type { FrameHandlers, FrameRenameRequest, Rect } from '../frames/types';
import type { EndpointDrag, PendingConnector } from '../connectors/types';
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
  /** Block currently hovered while dragging out a connector, highlighted as a drop target. */
  dropTargetId: string | null;
  /** block id → colors of remote peers selecting it (drawn as outline ring(s) on the card). */
  peerColorsById: Map<string, string[]>;
  handlers: BlockHandlers;
}

interface ConnectorLayer {
  connectors: Connector[];
  rectById: Map<string, Rect>;
  drag: { ids: Set<string>; dx: number; dy: number } | null;
  pending: PendingConnector | null;
  endpointDrag: EndpointDrag | null;
  selectedId: string | null;
  canEdit: boolean;
  onReshapeStart: (id: string, e: React.PointerEvent) => void;
  onEndpointStart: (id: string, end: 'source' | 'target', e: React.PointerEvent) => void;
  onContextMenu: (id: string, clientX: number, clientY: number) => void;
}

interface PeerLayerProps {
  peers: RemotePresencePeer[];
  frameById: Map<string, Frame>;
}

interface Props {
  offset: { x: number; y: number };
  scale: number;
  frameLayer: FrameLayer;
  blockLayer: BlockLayer;
  connectorLayer: ConnectorLayer;
  peerLayer: PeerLayerProps;
}

const WORLD_BASE_STYLE: CSSProperties = { transformOrigin: '0 0', willChange: 'transform' };

/** The transformed world: frames (outer→inner), blocks, and peer selection outlines. */
function CanvasWorld({ offset, scale, frameLayer, blockLayer, connectorLayer, peerLayer }: Props) {
  const { visibleFrames, framePresent, dragHover, selectedFrameId, handlers: frameHandlers, renameRequest } = frameLayer;
  const { visibleBlocks, selectedIds, dropTargetId, peerColorsById, handlers: blockHandlers } = blockLayer;

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

      {/* Connectors (above frames, below blocks) */}
      <Connectors
        connectors={connectorLayer.connectors}
        rectById={connectorLayer.rectById}
        drag={connectorLayer.drag}
        pending={connectorLayer.pending}
        endpointDrag={connectorLayer.endpointDrag}
        selectedId={connectorLayer.selectedId}
        canEdit={connectorLayer.canEdit}
        onReshapeStart={connectorLayer.onReshapeStart}
        onEndpointStart={connectorLayer.onEndpointStart}
        onContextMenu={connectorLayer.onContextMenu}
      />

      {/* Blocks (skip those inside a collapsed frame) */}
      {visibleBlocks.map(block => (
        <BlockContainer
          key={block.id}
          block={block}
          scale={scale}
          selected={selectedIds.has(block.id)}
          isInMultiSelection={selectedIds.size > 1 && selectedIds.has(block.id)}
          isDropTarget={block.id === dropTargetId}
          peerColors={peerColorsById.get(block.id)}
          handlers={blockHandlers}
        />
      ))}

      {/* Remote peer frame-selection outlines (canvas-space, scale-correct).
          Block selections are drawn on each block's card (see Block.tsx). */}
      <PeerSelections peers={peerLayer.peers} frameById={peerLayer.frameById} />
    </div>
  );
}

export default memo(CanvasWorld);
