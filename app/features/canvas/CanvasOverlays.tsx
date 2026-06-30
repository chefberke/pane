'use client';
import dynamic from 'next/dynamic';
import { AnimatePresence } from 'framer-motion';
import type { Block, Frame } from '@/app/features/types';
import type { ContextMenuState } from '../context-menu/types';
import type { ToolbarStatus, ToolbarActions } from '../toolbar/types';
import type { ThemeChoice } from './hooks/useTheme';
import type { CommentHandlers, CommentTarget, Marquee } from './types';
import AddInput from '../add-input/AddInput';
import Toolbar from '../toolbar/Toolbar';
import CommentsPopover from '../comments/CommentsPopover';
import ContextMenu from '../context-menu/ContextMenu';
import ZoomControls from './ZoomControls';
import ItemsButton from '../items-panel/ItemsButton';
import MenuButton from '../menu-panel/MenuButton';
import ShortcutsButton from './ShortcutsButton';
import EmptyState from './EmptyState';
import HintFlash from './HintFlash';
import { ZOOM_STEP } from './constants';

// Heavy, conditionally-mounted overlays — code-split out of the initial canvas
// chunk and loaded on demand. All are client-only interactive UI, so SSR is off.
const ImageLightbox = dynamic(() => import('../blocks/ImageLightbox'), { ssr: false });
const PdfLightbox = dynamic(() => import('../blocks/PdfLightbox'), { ssr: false });
const SearchModal = dynamic(() => import('../search/SearchModal'), { ssr: false });
const ShortcutsHelp = dynamic(() => import('./ShortcutsHelp'), { ssr: false });
const ItemsSheet = dynamic(() => import('../items-panel/ItemsSheet'), { ssr: false });

interface Transient {
  marquee: Marquee | null;
  addPos: { x: number; y: number; connectSourceId?: string } | null;
  menu: ContextMenuState | null;
  hint: { x: number; y: number; message: string } | null;
  commentTarget: CommentTarget;
}

interface Modals {
  isSearchOpen: boolean;
  isHelpOpen: boolean;
  isItemsOpen: boolean;
  lightbox: { url: string; alt?: string } | null;
  pdfLightbox: { url: string; title?: string } | null;
}

interface Data {
  blocks: Block[];
  frames: Frame[];
  blockById: Map<string, Block>;
  frameById: Map<string, Frame>;
  scale: number;
  canUndo: boolean;
  canRedo: boolean;
  themeChoice: ThemeChoice;
  topRightSlot?: React.ReactNode;
  toolbarStatus: ToolbarStatus;
  toolbarActions: ToolbarActions;
}

interface Actions {
  handleAddSubmit: (value: string, sx: number, sy: number, connectSourceId?: string) => void;
  setAddPos: (pos: { x: number; y: number; connectSourceId?: string } | null) => void;
  closeMenu: () => void;
  setCommentTarget: (t: CommentTarget) => void;
  navigateToBlock: (block: Block) => void;
  navigateToFrame: (frame: Frame) => void;
  setIsSearchOpen: (v: boolean) => void;
  setIsHelpOpen: (v: boolean | ((p: boolean) => boolean)) => void;
  setIsItemsOpen: (v: boolean | ((p: boolean) => boolean)) => void;
  setLightbox: (v: { url: string; alt?: string } | null) => void;
  setPdfLightbox: (v: { url: string; title?: string } | null) => void;
  handleDeleteBlock: (id: string) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  zoomBy: (factor: number) => void;
  resetView: () => void;
  undo: () => void;
  redo: () => void;
  setTheme: (choice: ThemeChoice) => void;
}

interface Props {
  canEdit: boolean;
  isFollowing: boolean;
  transient: Transient;
  modals: Modals;
  data: Data;
  commentHandlers: CommentHandlers;
  actions: Actions;
}

/** The full floating overlay stack rendered above the canvas world (chrome, modals, popovers). */
export default function CanvasOverlays({ canEdit, isFollowing, transient, modals, data, commentHandlers, actions }: Props) {
  const { marquee, addPos, menu, hint, commentTarget } = transient;
  const { isSearchOpen, isHelpOpen, isItemsOpen, lightbox, pdfLightbox } = modals;
  const { blocks, frames, blockById, frameById, scale, canUndo, canRedo, themeChoice, topRightSlot, toolbarStatus, toolbarActions } = data;

  return (
    <>
      {/* Marquee selection box */}
      {marquee && (
        <div
          className="absolute pointer-events-none z-50"
          style={{
            left: marquee.x1,
            top: marquee.y1,
            width: marquee.x2 - marquee.x1,
            height: marquee.y2 - marquee.y1,
            border: '1.5px solid var(--color-marquee-border)',
            background: 'var(--color-marquee-bg)',
            borderRadius: 3,
          }}
        />
      )}

      {canEdit && !isFollowing && addPos && (
        <AddInput
          x={addPos.x}
          y={addPos.y}
          onSubmit={val => actions.handleAddSubmit(val, addPos.x, addPos.y, addPos.connectSourceId)}
          onClose={() => actions.setAddPos(null)}
        />
      )}

      {canEdit && !isFollowing && menu && (
        <>
          {/* Click-catcher: any pointer down / right-click outside the menu dismisses it. */}
          <div
            className="absolute inset-0 z-40"
            onPointerDown={actions.closeMenu}
            onContextMenu={e => { e.preventDefault(); actions.closeMenu(); }}
          />
          <ContextMenu x={menu.x} y={menu.y} bounds={menu.bounds} rows={menu.rows} onClose={actions.closeMenu} />
        </>
      )}

      <AnimatePresence>
        {hint && (
          <HintFlash
            key={`${hint.x}-${hint.y}-${hint.message}`}
            x={hint.x}
            y={hint.y}
            message={hint.message}
          />
        )}
      </AnimatePresence>

      {!isFollowing && commentTarget && (
        <CommentsPopover
          targetId={commentTarget.id}
          comments={
            commentTarget.kind === 'block'
              ? blockById.get(commentTarget.id)?.comments ?? []
              : frameById.get(commentTarget.id)?.comments ?? []
          }
          x={commentTarget.x}
          y={commentTarget.y}
          onAdd={commentTarget.kind === 'block' ? commentHandlers.handleAddComment : commentHandlers.handleAddFrameComment}
          onDelete={commentTarget.kind === 'block' ? commentHandlers.handleDeleteComment : commentHandlers.handleDeleteFrameComment}
          onReply={commentTarget.kind === 'block' ? commentHandlers.handleReplyComment : commentHandlers.handleReplyFrameComment}
          onClose={() => actions.setCommentTarget(null)}
        />
      )}

      {!isFollowing && isSearchOpen && (
        <SearchModal
          blocks={blocks}
          onClose={() => actions.setIsSearchOpen(false)}
          onNavigate={actions.navigateToBlock}
        />
      )}

      {!isFollowing && isHelpOpen && (
        <ShortcutsHelp onClose={() => actions.setIsHelpOpen(false)} />
      )}

      {lightbox && (
        <ImageLightbox url={lightbox.url} alt={lightbox.alt} onClose={() => actions.setLightbox(null)} />
      )}

      {pdfLightbox && (
        <PdfLightbox url={pdfLightbox.url} title={pdfLightbox.title} onClose={() => actions.setPdfLightbox(null)} />
      )}

      {!isFollowing && isItemsOpen && (
        <ItemsSheet
          blocks={blocks}
          frames={frames}
          onClose={() => actions.setIsItemsOpen(false)}
          onNavigate={actions.navigateToBlock}
          onNavigateFrame={actions.navigateToFrame}
          onDelete={actions.handleDeleteBlock}
          onTogglePin={id => actions.updateBlock(id, { pinned: !blockById.get(id)?.pinned })}
        />
      )}

      {canEdit && !isFollowing && <Toolbar status={toolbarStatus} actions={toolbarActions} />}

      {!isFollowing && (
        <ZoomControls
          scale={scale}
          onZoomIn={() => actions.zoomBy(ZOOM_STEP)}
          onZoomOut={() => actions.zoomBy(1 / ZOOM_STEP)}
          onReset={actions.resetView}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={actions.undo}
          onRedo={actions.redo}
        />
      )}

      {!isFollowing && <ShortcutsButton onClick={() => actions.setIsHelpOpen(p => !p)} />}

      {/* Top-right cluster: extra slot (Share / AvatarStack) + Items */}
      {!isFollowing && (
        <div className="absolute top-6 right-6 pointer-events-auto flex items-center gap-2">
          {topRightSlot}
          <ItemsButton count={blocks.length} onClick={() => actions.setIsItemsOpen(p => !p)} />
        </div>
      )}

      {!isFollowing && <MenuButton themeChoice={themeChoice} onSetTheme={actions.setTheme} />}

      <AnimatePresence>
        {blocks.length === 0 && frames.length === 0 && !addPos && <EmptyState key="empty" />}
      </AnimatePresence>
    </>
  );
}
