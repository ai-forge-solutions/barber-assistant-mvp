"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type ClassValue = string | false | null | undefined;

function cn(...classes: ClassValue[]) {
  return classes.filter(Boolean).join(" ");
}

const DoubleCheckIcon = ({
  className = "w-3.5 h-3.5",
}: {
  className?: string;
}) => (
  <svg
    className={className}
    viewBox="0 0 16 11"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M11.045 0.584961L11.9883 1.52829L5.85833 7.65829L2.55833 4.35829L3.50167 3.41496L5.85833 5.77163L11.045 0.584961ZM14.345 0.584961L15.2883 1.52829L9.15833 7.65829L8.215 6.71496L14.345 0.584961ZM9.15833 9.54496L5.85833 6.24496L6.80167 5.30163L9.15833 7.65829L14.345 2.47163L15.2883 3.41496L9.15833 9.54496Z" />
  </svg>
);

const PhoneCallIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const VideoCallIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

const ArrowLeftIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const MoreVerticalIcon = ({
  className = "w-4 h-4",
}: {
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="5" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="19" r="2" />
  </svg>
);

const PaperclipIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

const CameraIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const MicrophoneIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const EmojiIcon = ({ className = "w-4.5 h-4.5" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth={3} />
    <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth={3} />
  </svg>
);

export interface ChatMessage {
  id: number;
  sender: string;
  avatarInitial?: string;
  text?: string;
  isCurrentUser: boolean;
  timestamp: string;
  isImage?: boolean;
  imageUrl?: string;
  imageCaption?: string;
}

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: 1,
    sender: "Pablo",
    avatarInitial: "P",
    text: "Buenas! ¿Tienes hueco mañana por la tarde?",
    isCurrentUser: false,
    timestamp: "18:42",
  },
  {
    id: 2,
    sender: "Barbero",
    avatarInitial: "B",
    text: "Mañana imposible, voy completo 😅",
    isCurrentUser: true,
    timestamp: "18:44",
  },
  {
    id: 3,
    sender: "Pablo",
    avatarInitial: "P",
    text: "¿Y el viernes a última hora?",
    isCurrentUser: false,
    timestamp: "18:45",
  },
  {
    id: 4,
    sender: "Barbero",
    avatarInitial: "B",
    text: "Me queda 18:30, pero te lo tengo que confirmar.",
    isCurrentUser: true,
    timestamp: "18:48",
  },
  {
    id: 5,
    sender: "Pablo",
    avatarInitial: "P",
    text: "Uff, justo salgo tarde. Déjame mirar y te digo.",
    isCurrentUser: false,
    timestamp: "18:51",
  },
  {
    id: 6,
    sender: "Barbero",
    avatarInitial: "B",
    text: "Sin problema. Te lo guardo un rato, pero se me puede llenar.",
    isCurrentUser: true,
    timestamp: "18:52",
  },
];

interface MessageSequenceStep {
  index: number;
  typingAt?: number;
  revealAt: number;
}

const MESSAGE_SEQUENCE: MessageSequenceStep[] = [
  { index: 0, typingAt: 900, revealAt: 2900 },
  { index: 1, revealAt: 5600 },
  { index: 2, typingAt: 7600, revealAt: 10100 },
  { index: 3, revealAt: 13300 },
  { index: 4, typingAt: 15300, revealAt: 18400 },
  { index: 5, revealAt: 21600 },
];
const CYCLE_RESET_DELAY = 28500;

export interface MobileMockupProps {
  headerTitle?: string;
  headerSubtitle?: string;
  avatarUrl?: string;
  avatarFallback?: string;
  messages?: ChatMessage[];
  autoPlay?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function MobileMockup({
  headerTitle = "Pablo",
  headerSubtitle = "online",
  avatarUrl = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  avatarFallback = "P",
  messages = DEFAULT_MESSAGES,
  autoPlay = true,
  className,
  children,
}: MobileMockupProps) {
  const [visibleMessages, setVisibleMessages] = useState<ChatMessage[]>(autoPlay ? [] : messages);
  const [showTyping, setShowTyping] = useState(false);
  const [cycleKey, setCycleKey] = useState(0);

  useEffect(() => {
    if (!autoPlay || children) {
      return;
    }

    let isMounted = true;
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(
      setTimeout(() => {
        if (!isMounted) return;
        setVisibleMessages([]);
        setShowTyping(false);
      }, 0),
    );

    MESSAGE_SEQUENCE.forEach((step) => {
      if (step.typingAt !== undefined) {
        timers.push(
          setTimeout(() => {
            if (isMounted) setShowTyping(true);
          }, step.typingAt),
        );
      }

      timers.push(
        setTimeout(() => {
          if (!isMounted) return;
          setShowTyping(false);
          setVisibleMessages(messages.slice(0, step.index + 1));
        }, step.revealAt),
      );
    });

    timers.push(
      setTimeout(() => {
        if (isMounted) setCycleKey((prev) => prev + 1);
      }, CYCLE_RESET_DELAY),
    );

    return () => {
      isMounted = false;
      timers.forEach(clearTimeout);
    };
  }, [autoPlay, children, messages, cycleKey]);

  const displayMessages = !autoPlay || children ? messages : visibleMessages;

  return (
    <div
      className={cn(
        "relative mx-auto flex w-full max-w-[245px] select-none items-center justify-center py-2 xs:max-w-[265px] sm:max-w-[285px]",
        className,
      )}
      aria-label="Mockup realista de conversación de WhatsApp"
    >
      <motion.div
        initial={{ opacity: 0, y: 35, scale: 0.94, rotate: -1.5 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
        whileHover={{ y: -6, rotate: 0.5, transition: { duration: 0.25 } }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
        className="relative flex h-[490px] w-full transform-gpu flex-col overflow-hidden rounded-[40px] bg-neutral-900 p-2.5 transition-colors xs:h-[530px] sm:h-[560px]"
      >
        <div className="absolute -left-[5px] top-24 h-8 w-[2.5px] rounded-l-xs bg-neutral-700" />
        <div className="absolute -left-[5px] top-36 h-10 w-[2.5px] rounded-l-xs bg-neutral-700" />
        <div className="absolute -left-[5px] top-48 h-10 w-[2.5px] rounded-l-xs bg-neutral-700" />
        <div className="absolute -right-[5px] top-32 h-14 w-[2.5px] rounded-r-xs bg-neutral-700" />

        <div className="relative isolate flex h-full w-full transform-gpu flex-col overflow-hidden rounded-[30px] bg-[#efeae2] text-neutral-900">
          <div className="z-30 flex shrink-0 items-center justify-between bg-[#008069] px-4 pb-1 pt-2 text-[11px] font-semibold text-white transition-colors">
            <span className="w-10 text-left font-bold tracking-tight">18:52</span>

            <div className="flex items-center justify-end gap-1.5 text-white">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="2" y="16" width="3.5" height="5" rx="0.5" />
                <rect x="7.5" y="12" width="3.5" height="9" rx="0.5" />
                <rect x="13" y="8" width="3.5" height="13" rx="0.5" />
                <rect x="18.5" y="4" width="3.5" height="17" rx="0.5" />
              </svg>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
              <svg className="h-2.5 w-4" fill="none" viewBox="0 0 24 14" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <rect x="1" y="1" width="18" height="12" rx="3" />
                <rect x="3" y="3" width="11" height="8" rx="1.5" fill="currentColor" />
                <path d="M21 4v6" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          <div className="z-20 flex shrink-0 items-center justify-between bg-[#008069] px-3 py-1.5 text-white transition-colors">
            <div className="flex items-center gap-1.5">
              <button type="button" className="text-white/90 transition-colors hover:text-white" aria-label="Volver">
                <ArrowLeftIcon />
              </button>
              <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-700 text-[11px] font-bold text-white">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={headerTitle} className="h-full w-full object-cover" />
                ) : (
                  <span>{avatarFallback}</span>
                )}
              </div>

              <div className="flex min-w-0 flex-col">
                <span className="max-w-[100px] truncate text-[11.5px] font-semibold leading-tight text-white xs:max-w-[120px]">
                  {headerTitle}
                </span>
                <span className="mt-0.5 text-[9.5px] font-medium leading-none text-emerald-200">
                  {headerSubtitle}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-white/90">
              <button type="button" className="transition-colors hover:text-white" aria-label="Videollamada">
                <VideoCallIcon className="h-3.5 w-3.5" />
              </button>
              <button type="button" className="transition-colors hover:text-white" aria-label="Llamada">
                <PhoneCallIcon className="h-3.5 w-3.5" />
              </button>
              <button type="button" className="transition-colors hover:text-white" aria-label="Más opciones">
                <MoreVerticalIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 flex-col justify-end overflow-hidden bg-[#efeae2] p-2.5 transition-colors">
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{ backgroundImage: "radial-gradient(#111111 1px, transparent 1px)", backgroundSize: "18px 18px" }}
            />
            {children ? (
              <div className="relative z-10 h-full w-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {children}
              </div>
            ) : (
              <>
                <div className="relative z-10 mx-auto mb-1.5 rounded-full bg-white/90 px-2.5 py-0.5 text-[9px] font-medium text-neutral-600">
                  Hoy
                </div>
                <div className="relative z-10 flex flex-1 flex-col justify-end space-y-1.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <AnimatePresence mode="sync">
                    {displayMessages.map((msg) => (
                      <motion.div
                        key={`${cycleKey}-${msg.id}`}
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className={cn("flex flex-col", msg.isCurrentUser ? "items-end" : "items-start")}
                      >
                        <div
                          className={cn(
                            "relative flex max-w-[85%] flex-col rounded-xl px-2.5 py-1 text-[11px] transition-colors",
                            msg.isCurrentUser
                              ? "rounded-tr-none bg-[#dcf8c6] text-neutral-900"
                              : "rounded-tl-none bg-white text-neutral-900",
                          )}
                        >
                          {msg.isImage ? (
                            <div className="flex min-w-[150px] flex-col gap-1">
                              <div className="relative max-h-[100px] overflow-hidden rounded-lg">
                                {msg.imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={msg.imageUrl} alt="Imagen adjunta" className="h-22 w-full object-cover" />
                                ) : null}
                              </div>
                              {msg.imageCaption ? <p className="mt-0.5 px-0.5 text-[10.5px] leading-tight">{msg.imageCaption}</p> : null}
                            </div>
                          ) : (
                            <p className="text-[11px] leading-tight">{msg.text}</p>
                          )}

                          <div className="mt-0.5 flex items-center justify-end gap-1 self-end">
                            <span className={cn("text-[8.5px]", msg.isCurrentUser ? "text-emerald-800/70" : "text-neutral-400")}>{msg.timestamp}</span>
                            {msg.isCurrentUser ? <DoubleCheckIcon className="h-3 w-3 text-[#34b7f1]" /> : null}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {showTyping ? (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-start">
                        <div className="flex items-center gap-1.5 rounded-xl rounded-tl-none bg-white px-3 py-2">
                          <span className="text-[10px] font-semibold text-emerald-600">escribiendo</span>
                          <div className="flex items-center gap-1">
                            {[0, 1, 2].map((dotIndex) => (
                              <motion.span
                                key={dotIndex}
                                className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                                animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: dotIndex * 0.15 }}
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>

          <div className="z-20 flex shrink-0 items-center gap-1.5 bg-[#f0f2f5] p-2 transition-colors">
            <button type="button" className="p-1 text-neutral-600 transition-colors hover:text-emerald-600" aria-label="Emoji">
              <EmojiIcon />
            </button>
            <div className="flex flex-1 items-center justify-between rounded-full bg-white px-3 py-1.5 text-xs text-neutral-400">
              <span className="truncate">Mensaje</span>
              <div className="flex items-center gap-2 text-neutral-400">
                <button type="button" className="hover:text-neutral-600" aria-label="Adjuntar">
                  <PaperclipIcon />
                </button>
                <button type="button" className="hover:text-neutral-600" aria-label="Cámara">
                  <CameraIcon />
                </button>
              </div>
            </div>
            <button type="button" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-white transition-colors hover:bg-emerald-600" aria-label="Audio">
              <MicrophoneIcon />
            </button>
          </div>

          <div className="flex shrink-0 justify-center bg-[#f0f2f5] pb-1.5 pt-0.5">
            <div className="h-1 w-24 rounded-full bg-neutral-400" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default MobileMockup;
