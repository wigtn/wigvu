"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  X,
  Minimize2,
  Maximize2,
  Copy,
  Download,
  Check,
  GripVertical,
  NotebookPen,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface FloatingMemoProps {
  videoTitle?: string;
  videoId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function FloatingMemo({
  videoTitle,
  videoId,
  isOpen,
  onClose,
}: FloatingMemoProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [memo, setMemo] = useState("");
  const [copied, setCopied] = useState(false);
  const [size, setSize] = useState({ width: 320, height: 300 });
  const [position, setPosition] = useState(() => {
    if (typeof window !== "undefined") {
      return { x: window.innerWidth - 320 - 20, y: 80 };
    }
    return { x: 0, y: 80 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    initialWidth: number;
    initialHeight: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // 드래그 시작
  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      dragRef.current = {
        startX: clientX,
        startY: clientY,
        initialX: position.x,
        initialY: position.y,
      };
      setIsDragging(true);
    },
    [position]
  );

  // 드래그 중 - requestAnimationFrame으로 부드럽게
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!dragRef.current) return;

      // 기존 RAF 취소
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        if (!dragRef.current) return;

        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

        const deltaX = clientX - dragRef.current.startX;
        const deltaY = clientY - dragRef.current.startY;

        const newX = dragRef.current.initialX + deltaX;
        const newY = dragRef.current.initialY + deltaY;

        // 화면 경계 체크
        const maxX =
          window.innerWidth - (containerRef.current?.offsetWidth || 320);
        const maxY =
          window.innerHeight - (containerRef.current?.offsetHeight || 100);

        setPosition({
          x: Math.max(0, Math.min(maxX, newX)),
          y: Math.max(0, Math.min(maxY, newY)),
        });
      });
    };

    const handleEnd = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setIsDragging(false);
      dragRef.current = null;
    };

    // passive: false로 터치 이벤트 최적화
    window.addEventListener("mousemove", handleMove, { passive: true });
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove, { passive: true });
    window.addEventListener("touchend", handleEnd);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging]);

  // 리사이즈 시작
  const handleResizeStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      resizeRef.current = {
        startX: clientX,
        startY: clientY,
        initialWidth: size.width,
        initialHeight: size.height,
      };
      setIsResizing(true);
    },
    [size]
  );

  // 리사이즈 중
  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!resizeRef.current) return;

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        if (!resizeRef.current) return;

        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

        const deltaX = clientX - resizeRef.current.startX;
        const deltaY = clientY - resizeRef.current.startY;

        const newWidth = resizeRef.current.initialWidth + deltaX;
        const newHeight = resizeRef.current.initialHeight + deltaY;

        setSize({
          width: Math.max(280, Math.min(600, newWidth)),
          height: Math.max(200, Math.min(500, newHeight)),
        });
      });
    };

    const handleEnd = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setIsResizing(false);
      resizeRef.current = null;
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove, { passive: true });
    window.addEventListener("touchend", handleEnd);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isResizing]);

  // 클립보드 복사
  const handleCopy = useCallback(async () => {
    const content = videoTitle ? `[${videoTitle}]\n${memo}` : memo;

    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [memo, videoTitle]);

  // 파일 다운로드
  const handleDownload = useCallback(() => {
    const content = videoTitle
      ? `[${videoTitle}]\nhttps://youtube.com/watch?v=${videoId}\n\n${memo}`
      : memo;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `memo-${videoId || "note"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [memo, videoTitle, videoId]);

  // 닫힌 상태
  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      style={{
        left: position.x,
        top: position.y,
        width: isMinimized ? "auto" : size.width,
        transform: "translate3d(0, 0, 0)", // GPU 가속
        willChange:
          isDragging || isResizing ? "left, top, width, height" : "auto",
      }}
      className={cn(
        "fixed z-50 bg-card border border-border rounded-lg shadow-2xl",
        isDragging || isResizing
          ? "cursor-grabbing select-none"
          : "transition-all duration-200"
      )}
    >
      {/* Header */}
      <div
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        className="flex items-center justify-between px-3 py-2 border-b border-border cursor-grab bg-(--background-elevated) rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
          <NotebookPen className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium">Memo</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 rounded hover:bg-muted transition-colors"
            title={isMinimized ? "Expand" : "Collapse"}
          >
            {isMinimized ? (
              <Maximize2 className="w-3.5 h-3.5" />
            ) : (
              <Minimize2 className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-muted transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="p-3 flex flex-col" style={{ height: size.height - 44 }}>
          {/* Textarea */}
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Take notes while watching..."
            className="flex-1 w-full p-3 text-sm bg-(--background-elevated) border border-border rounded-md resize-none focus:outline-none focus:border-accent transition-colors"
          />

          {/* Actions */}
          <div className="flex items-center justify-between mt-3 shrink-0">
            <span className="text-xs text-muted-foreground">
              {memo.length} chars
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!memo.trim()}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all",
                  memo.trim()
                    ? "bg-muted hover:bg-muted/80 text-foreground"
                    : "bg-muted/50 text-muted-foreground cursor-not-allowed"
                )}
                title="Copy to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                disabled={!memo.trim()}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all",
                  memo.trim()
                    ? "bg-accent text-background hover:bg-accent/90"
                    : "bg-accent/50 text-background/50 cursor-not-allowed"
                )}
                title="Download as text file"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resize Handle */}
      {!isMinimized && (
        <div
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          style={{
            background:
              "linear-gradient(135deg, transparent 50%, var(--border) 50%)",
            borderBottomRightRadius: "0.5rem",
          }}
        />
      )}
    </div>
  );
}
