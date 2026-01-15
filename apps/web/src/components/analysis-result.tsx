// "use client";

// import { useState, useRef, useCallback, useEffect } from "react";
// import { VideoAnalysis } from "@/types/analysis";
// import { YTPlayer } from "@/types/youtube";
// import { formatDuration, formatViewCount } from "@/lib/youtube";
// import { useVideoSync } from "@/hooks/use-video-sync";
// import { ScriptPanel } from "@/components/script-panel";
// import {
//   Clock,
//   Eye,
//   ThumbsUp,
//   Calendar,
//   Play,
//   FileText,
//   Mic,
//   AlertCircle,
//   ChevronDown,
//   ChevronUp,
// } from "lucide-react";

// interface AnalysisResultProps {
//   analysis: VideoAnalysis;
// }

// export function AnalysisResult({ analysis }: AnalysisResultProps) {
//   const [isDetailsOpen, setIsDetailsOpen] = useState(true);
//   const playerRef = useRef<YTPlayer | null>(null);
//   const containerRef = useRef<HTMLDivElement>(null);
//   const [isPlayerReady, setIsPlayerReady] = useState(false);
//   const playerIdRef = useRef(
//     `youtube-player-${Math.random().toString(36).substr(2, 9)}`
//   );

//   // 영상-자막 동기화 훅
//   const {
//     activeSegmentIndex,
//     setPlayer,
//     autoScrollEnabled,
//     toggleAutoScroll,
//   } = useVideoSync(analysis.transcriptSegments);

//   // Load YouTube IFrame API
//   useEffect(() => {
//     if (typeof window === "undefined") return;

//     const loadPlayer = () => {
//       if (!containerRef.current) return;

//       const playerId = playerIdRef.current;

//       let playerDiv = document.getElementById(playerId);
//       if (!playerDiv) {
//         playerDiv = document.createElement("div");
//         playerDiv.id = playerId;
//         containerRef.current.appendChild(playerDiv);
//       }

//       const player = new window.YT.Player(playerId, {
//         videoId: analysis.videoId,
//         playerVars: {
//           autoplay: 0,
//           rel: 0,
//           modestbranding: 1,
//         },
//         events: {
//           onReady: () => {
//             setIsPlayerReady(true);
//             playerRef.current = player;
//             setPlayer(player);
//           },
//         },
//       });
//     };

//     if (window.YT && window.YT.Player) {
//       loadPlayer();
//     } else {
//       const tag = document.createElement("script");
//       tag.src = "https://www.youtube.com/iframe_api";
//       const firstScriptTag = document.getElementsByTagName("script")[0];
//       firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

//       window.onYouTubeIframeAPIReady = loadPlayer;
//     }

//     return () => {
//       if (playerRef.current) {
//         playerRef.current.destroy();
//         playerRef.current = null;
//       }
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [analysis.videoId]); // setPlayer 제거 - 재생성 방지

//   // 자막/하이라이트 클릭 시 시간 이동 - 직접 playerRef 사용
//   const handleSegmentClick = useCallback(
//     (seconds: number) => {
//       if (playerRef.current && isPlayerReady) {
//         playerRef.current.seekTo(seconds, true);
//         playerRef.current.playVideo();
//       }
//       // Scroll to player on mobile
//       containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
//     },
//     [isPlayerReady]
//   );

//   const scoreLabel =
//     analysis.watchScore >= 8
//       ? "강력 추천"
//       : analysis.watchScore >= 6
//         ? "추천"
//         : analysis.watchScore >= 4
//           ? "보통"
//           : "비추천";

//   const transcriptSourceInfo = {
//     youtube: { icon: FileText, label: "자막", color: "text-foreground" },
//     stt: { icon: Mic, label: "음성 인식", color: "text-foreground" },
//     none: {
//       icon: AlertCircle,
//       label: "메타데이터만",
//       color: "text-muted-foreground",
//     },
//   };

//   const sourceInfo = transcriptSourceInfo[analysis.transcriptSource || "none"];
//   const hasSegments = analysis.transcriptSegments && analysis.transcriptSegments.length > 0;

//   // 핵심장면 컴포넌트 (재사용)
//   const HighlightsSection = ({ className = "" }: { className?: string }) => (
//     analysis.highlights && analysis.highlights.length > 0 ? (
//       <div className={`space-y-2 ${className}`}>
//         <div>
//           <p className="swiss-caption">핵심 장면</p>
//           <p className="text-xs text-muted-foreground mt-1">
//             클릭하면 해당 시간으로 이동
//           </p>
//         </div>
//         <div className="space-y-0">
//           {analysis.highlights.map((highlight, index) => (
//             <button
//               key={index}
//               onClick={() => handleSegmentClick(highlight.timestamp)}
//               className="w-full text-left flex items-start gap-3 sm:gap-4 py-3 border-t border-border hover:bg-muted/50 transition-colors group first:border-t-0"
//             >
//               <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-mono text-accent min-w-15 sm:min-w-17.5">
//                 <Play className="w-3 h-3" />
//                 {formatDuration(highlight.timestamp)}
//               </div>
//               <div className="flex-1 min-w-0">
//                 <p className="font-medium group-hover:text-accent transition-colors text-sm truncate sm:whitespace-normal">
//                   {highlight.title}
//                 </p>
//                 <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 sm:line-clamp-none">
//                   {highlight.description}
//                 </p>
//               </div>
//             </button>
//           ))}
//         </div>
//       </div>
//     ) : null
//   );

//   return (
//     <div className="space-y-6 lg:space-y-8">
//       {/* Main Content: Video + Script Panel */}
//       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
//         {/* Left: Video Player + Metadata */}
//         <div className="lg:col-span-7 space-y-4">
//           {/* YouTube Player */}
//           <div
//             ref={containerRef}
//             className="aspect-video w-full bg-muted"
//           >
//             {!isPlayerReady && (
//               <div className="w-full h-full flex items-center justify-center">
//                 <span className="text-sm text-muted-foreground">
//                   플레이어 로딩 중...
//                 </span>
//               </div>
//             )}
//           </div>

//           {/* Video Info */}
//           <div className="space-y-3">
//             <h2 className="text-xl font-bold leading-tight">
//               {analysis.title}
//             </h2>
//             <p className="text-muted-foreground">{analysis.channelName}</p>

//             <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
//               <span className="flex items-center gap-1.5">
//                 <Eye className="w-4 h-4" />
//                 {formatViewCount(analysis.viewCount)}
//               </span>
//               <span className="flex items-center gap-1.5">
//                 <ThumbsUp className="w-4 h-4" />
//                 {formatViewCount(analysis.likeCount)}
//               </span>
//               <span className="flex items-center gap-1.5">
//                 <Clock className="w-4 h-4" />
//                 {formatDuration(analysis.duration)}
//               </span>
//               <span className="flex items-center gap-1.5">
//                 <Calendar className="w-4 h-4" />
//                 {new Date(analysis.publishedAt).toLocaleDateString("ko-KR", {
//                   year: "numeric",
//                   month: "short",
//                   day: "numeric",
//                 })}
//               </span>
//             </div>

//             {/* Transcript Source Badge */}
//             <div className="flex items-center gap-2 text-sm">
//               <sourceInfo.icon className={`w-4 h-4 ${sourceInfo.color}`} />
//               <span className={sourceInfo.color}>{sourceInfo.label}</span>
//               {analysis.detectedLanguage && (
//                 <span className="text-muted-foreground">
//                   ({analysis.detectedLanguage.code.toUpperCase()}{" "}
//                   {(analysis.detectedLanguage.probability * 100).toFixed(0)}%)
//                 </span>
//               )}
//               {analysis.isKorean && (
//                 <span className="text-xs px-2 py-0.5 bg-foreground/10 text-foreground/80 rounded">
//                   번역 불필요
//                 </span>
//               )}
//             </div>
//           </div>

//           {/* 모바일: 핵심장면 (영상 바로 아래) */}
//           <div className="lg:hidden border border-border p-4">
//             <HighlightsSection />
//           </div>
//         </div>

//         {/* Right: Script Panel */}
//         <div className="lg:col-span-5 h-80 lg:h-auto lg:min-h-125">
//           {hasSegments ? (
//             <ScriptPanel
//               segments={analysis.transcriptSegments!}
//               activeIndex={activeSegmentIndex}
//               onSegmentClick={handleSegmentClick}
//               autoScrollEnabled={autoScrollEnabled}
//               onToggleAutoScroll={toggleAutoScroll}
//               isKorean={analysis.isKorean}
//             />
//           ) : (
//             <div className="h-full border border-border flex items-center justify-center bg-muted/30">
//               <div className="text-center text-muted-foreground">
//                 <AlertCircle className="w-8 h-8 mx-auto mb-2" />
//                 <p className="text-sm">자막을 사용할 수 없습니다</p>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Analysis Details (Collapsible) */}
//       <div className="border border-border">
//         <button
//           className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
//           onClick={() => setIsDetailsOpen(!isDetailsOpen)}
//         >
//           <span className="font-medium">분석 상세</span>
//           {isDetailsOpen ? (
//             <ChevronUp className="w-5 h-5 text-muted-foreground" />
//           ) : (
//             <ChevronDown className="w-5 h-5 text-muted-foreground" />
//           )}
//         </button>

//         {isDetailsOpen && (
//           <div className="border-t border-border p-4 sm:p-6 space-y-6 sm:space-y-8">
//             {/* Watch Score - 모바일 반응형 */}
//             <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
//               <div className="flex items-center sm:flex-col sm:items-start gap-3 sm:gap-0 sm:min-w-[100px]">
//                 <p className="swiss-caption sm:mb-2">시청 점수</p>
//                 <div className="flex items-baseline gap-1">
//                   <p className="text-4xl sm:text-5xl font-bold">{analysis.watchScore}</p>
//                   <p className="text-sm text-muted-foreground">/10</p>
//                 </div>
//               </div>
//               <div className="flex-1">
//                 <div className="space-y-3">
//                   <div className="h-2 bg-muted w-full">
//                     <div
//                       className="h-full bg-foreground transition-all"
//                       style={{ width: `${analysis.watchScore * 10}%` }}
//                     />
//                   </div>
//                   <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4">
//                     <span className="text-sm font-medium uppercase tracking-wide">
//                       {scoreLabel}
//                     </span>
//                     <p className="text-sm text-muted-foreground sm:max-w-md sm:text-right">
//                       {analysis.watchScoreReason}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Summary - 모바일 반응형 */}
//             <div className="space-y-2">
//               <p className="swiss-caption">요약</p>
//               <div className="space-y-2">
//                 {analysis.summary.split("\n").map((line, index) => (
//                   <p key={index} className="text-foreground leading-relaxed text-sm sm:text-base">
//                     {line.replace(/^\d+\.\s*/, "")}
//                   </p>
//                 ))}
//               </div>
//             </div>

//             {/* Keywords - 모바일 반응형 */}
//             <div className="space-y-2">
//               <p className="swiss-caption">키워드</p>
//               <div className="flex flex-wrap gap-2">
//                 {analysis.keywords.map((keyword, index) => (
//                   <span
//                     key={index}
//                     className="px-2 sm:px-3 py-1 sm:py-1.5 border border-border text-xs sm:text-sm"
//                   >
//                     {keyword}
//                   </span>
//                 ))}
//               </div>
//             </div>

//             {/* 데스크탑: 핵심장면 (분석 상세 안에) */}
//             <div className="hidden lg:block">
//               <HighlightsSection />
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
