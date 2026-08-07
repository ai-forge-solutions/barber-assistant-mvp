"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type ClassValue = string | false | null | undefined;

function cn(...classes: ClassValue[]) {
  return classes.filter(Boolean).join(" ");
}

const DoubleCheckIcon = ({ className = "h-3 w-3" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 11" fill="currentColor" aria-hidden="true">
    <path d="M11.045 0.584961L11.9883 1.52829L5.85833 7.65829L2.55833 4.35829L3.50167 3.41496L5.85833 5.77163L11.045 0.584961ZM14.345 0.584961L15.2883 1.52829L9.15833 7.65829L8.215 6.71496L14.345 0.584961ZM9.15833 9.54496L5.85833 6.24496L6.80167 5.30163L9.15833 7.65829L14.345 2.47163L15.2883 3.41496L9.15833 9.54496Z" />
  </svg>
);

const PhoneCallIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const VideoCallIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

const ArrowLeftIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const MoreVerticalIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="5" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="19" r="2" />
  </svg>
);

const PaperclipIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

const CameraIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const MicrophoneIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const EmojiIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
  text: string;
  isCurrentUser: boolean;
  timestamp: string;
}

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: 1,
    sender: "Cliente",
    avatarInitial: "C",
    text: "Buenas, ¿tienes hueco el jueves por la tarde?",
    isCurrentUser: false,
    timestamp: "18:42",
  },
  {
    id: 2,
    sender: "Barbero",
    avatarInitial: "B",
    text: "El jueves lo tengo lleno. ¿Te va el viernes?",
    isCurrentUser: true,
    timestamp: "18:44",
  },
  {
    id: 3,
    sender: "Cliente",
    avatarInitial: "C",
    text: "Depende, ¿a qué hora?",
    isCurrentUser: false,
    timestamp: "18:45",
  },
  {
    id: 4,
    sender: "Barbero",
    avatarInitial: "B",
    text: "11:00 o 13:30. Si no, ya sería martes.",
    isCurrentUser: true,
    timestamp: "18:48",
  },
  {
    id: 5,
    sender: "Cliente",
    avatarInitial: "C",
    text: "Uy, esas no puedo. Te digo algo luego.",
    isCurrentUser: false,
    timestamp: "18:51",
  },
];

export interface MobileMockupProps {
  headerTitle?: string;
  headerSubtitle?: string;
  avatarFallback?: string;
  messages?: ChatMessage[];
  autoPlay?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function MobileMockup({
  headerTitle = "Cliente por WhatsApp",
  headerSubtitle = "en línea",
  avatarFallback = "CL",
  messages = DEFAULT_MESSAGES,
  autoPlay = true,
  className,
  children,
}: MobileMockupProps) {
  const [visibleMessages, setVisibleMessages] = useState<ChatMessage[]>(autoPlay ? [] : messages);
  const [showTyping, setShowTyping] = useState(false);
  const [cycleKey, setCycleKey] = useState(0);

  useEffect(() => {
    if (!autoPlay || children) return;

    let isMounted = true;
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(
      setTimeout(() => {
        if (!isMounted) return;
        setVisibleMessages([]);
        setShowTyping(false);
      }, 0),
    );

    messages.forEach((_, index) => {
      timers.push(
        setTimeout(() => {
          if (!isMounted) return;
          setShowTyping(index < messages.length - 1);
          setVisibleMessages(messages.slice(0, index + 1));
        }, 650 + index * 850),
      );
    });

    timers.push(
      setTimeout(() => {
        if (!isMounted) return;
        setShowTyping(false);
      }, 650 + messages.length * 850),
    );

    timers.push(
      setTimeout(() => {
        if (isMounted) setCycleKey((current) => current + 1);
      }, 7200),
    );

    return () => {
      isMounted = false;
      timers.forEach(clearTimeout);
    };
  }, [autoPlay, children, messages, cycleKey]);

  const displayMessages = children || !autoPlay ? messages : visibleMessages;

  return (
    <div className={cn("relative mx-auto w-full max-w-[300px] select-none", className)} aria-label="Mockup de conversación de WhatsApp">
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96, rotate: -1.2 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
        whileHover={{ y: -4, rotate: 0.4, transition: { duration: 0.2 } }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        className="relative h-[560px] overflow-hidden rounded-[28px] border-[10px] border-[#111111] bg-[#111111]"
      >
        <div className="absolute left-1/2 top-2 z-40 h-4 w-24 -translate-x-1/2 rounded-b-sm bg-[#111111]" />
        <div className="flex h-full flex-col overflow-hidden rounded-sm bg-[#E5E5E5] text-[#111111]">
          <div className="z-30 flex items-center justify-between bg-[#111111] px-4 pb-1.5 pt-3 font-['DM_Sans'] text-[11px] font-medium text-white">
            <span>18:51</span>
            <span className="tracking-[0.08em]">5G ▰</span>
          </div>

          <div className="z-20 flex min-h-[52px] items-center justify-between border-t border-[#555555] bg-[#111111] px-2.5 py-2 text-white">
            <div className="flex min-w-0 items-center gap-2">
              <button type="button" className="flex h-8 w-8 items-center justify-center" aria-label="Volver">
                <ArrowLeftIcon />
              </button>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#111111] font-['Oswald'] text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
                {avatarFallback}
              </div>
              <div className="min-w-0">
                <p className="truncate font-['DM_Sans'] text-[13px] font-medium leading-tight text-white">{headerTitle}</p>
                <p className="font-['DM_Sans'] text-[10px] leading-tight text-white/80">{headerSubtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-white">
              <VideoCallIcon className="h-4 w-4" />
              <PhoneCallIcon className="h-4 w-4" />
              <MoreVerticalIcon className="h-4 w-4" />
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 flex-col justify-end overflow-hidden bg-[#E5E5E5] px-2.5 py-3">
            <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(#111111 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
            {children ? (
              <div className="relative z-10 h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</div>
            ) : (
              <>
                <div className="relative z-10 mx-auto mb-2 rounded-sm bg-white/90 px-2.5 py-1 font-['DM_Sans'] text-[10px] text-[#555555]">Hoy</div>
                <div className="relative z-10 flex flex-col gap-2 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <AnimatePresence mode="sync">
                    {displayMessages.map((message) => (
                      <motion.div
                        key={`${cycleKey}-${message.id}`}
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.94 }}
                        transition={{ type: "spring", stiffness: 380, damping: 26 }}
                        className={cn("flex", message.isCurrentUser ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[84%] rounded-sm border px-2.5 py-1.5 font-['DM_Sans'] text-[12px] leading-snug",
                            message.isCurrentUser ? "border-[#111111] bg-[#111111] text-white" : "border-[#E5E5E5] bg-white text-[#111111]",
                          )}
                        >
                          <p>{message.text}</p>
                          <div className={cn("mt-1 flex items-center justify-end gap-1 text-[9px]", message.isCurrentUser ? "text-[#E5E5E5]" : "text-[#555555]") }>
                            <span>{message.timestamp}</span>
                            {message.isCurrentUser ? <DoubleCheckIcon className="h-3 w-3 text-[#1A3A6B]" /> : null}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {showTyping ? (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                        <div className="flex items-center gap-1.5 rounded-sm bg-white px-3 py-2">
                          {[0, 1, 2].map((dot) => (
                            <motion.span
                              key={dot}
                              className="h-1.5 w-1.5 rounded-full bg-[#555555]"
                              animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
                              transition={{ duration: 0.65, repeat: Infinity, delay: dot * 0.15 }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>

                <div className="relative z-10 mt-3 border-l-4 border-[#C8102E] bg-white px-3 py-2">
                  <p className="font-['Oswald'] text-[11px] font-semibold uppercase tracking-[0.08em] text-[#111111]">Esto no es una cita</p>
                  <p className="mt-1 font-['DM_Sans'] text-[11px] leading-snug text-[#555555]">Es tiempo perdido cuadrando horarios.</p>
                </div>
              </>
            )}
          </div>

          <div className="z-20 flex items-center gap-1.5 border-t border-[#E5E5E5] bg-white p-2">
            <button type="button" className="flex h-8 w-8 shrink-0 items-center justify-center text-[#555555]" aria-label="Emoji">
              <EmojiIcon />
            </button>
            <div className="flex min-h-[36px] flex-1 items-center justify-between rounded-sm border border-[#E5E5E5] bg-white px-3 font-['DM_Sans'] text-[12px] text-[#999999]">
              <span>Mensaje</span>
              <div className="flex items-center gap-2 text-[#555555]">
                <PaperclipIcon />
                <CameraIcon />
              </div>
            </div>
            <button type="button" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-[#C8102E] text-white" aria-label="Audio">
              <MicrophoneIcon />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default MobileMockup;
