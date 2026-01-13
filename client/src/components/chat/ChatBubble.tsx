import { marked, type Token } from "marked";
import DOMPurify from "dompurify";
import { useState, useEffect, useRef } from "react";
import "../../styles/markdown.css";
import OknBotIcon from "../../icons/okn-bot.svg";
import type { QuickAction } from "../../types/chat";
import QuickActionButtons from "./QuickActionButtons";

const UserAvatar = () => (
  <div className="w-7 h-7 rounded-full bg-gray-900 dark:bg-gray-100 flex items-center justify-center flex-shrink-0">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-4 h-4 text-white dark:text-gray-900"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
    </svg>
  </div>
);

const BotAvatar = () => (
  <img
    src={OknBotIcon.src}
    alt="OKN Bot"
    className="w-7 h-7 rounded-full flex-shrink-0"
  />
);

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp: number;
  chart?: string;
  quickActions?: QuickAction[];
  isComplete?: boolean;
  onQuickActionClick?: (query: string) => void;
}

const ChatBubble = ({
  message,
  isUser,
  timestamp,
  chart,
  quickActions,
  isComplete = true,
  onQuickActionClick,
}: ChatBubbleProps) => {
  const [messageHtml, setMessageHtml] = useState("");
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parseMessage = async () => {
      const markedOptions = {
        breaks: true,
        gfm: true,
        headerIds: true,
        renderer: new marked.Renderer(),
        walkTokens: (token: Token) => {
          if (token.type === "heading") {
            token.depth = token.depth || 1;
          }
        },
      };

      const parsedMessage = await marked.parse(message, markedOptions);
      const sanitizedMessage = DOMPurify.sanitize(parsedMessage);
      setMessageHtml(sanitizedMessage);
    };

    parseMessage();

    // Animate in
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
            entry.target.classList.remove("opacity-0", "translate-y-1");
          }
        });
      },
      { threshold: 0.1 }
    );

    if (bubbleRef.current) {
      observer.observe(bubbleRef.current);
    }

    return () => {
      if (bubbleRef.current) {
        observer.unobserve(bubbleRef.current);
      }
    };
  }, [message]);

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      ref={bubbleRef}
      className="opacity-0 translate-y-1 transition-all duration-200 ease-out py-3"
    >
      <div className="flex gap-3 items-start">
        {/* Avatar */}
        <div className="mt-0.5">
          {isUser ? <UserAvatar /> : <BotAvatar />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
              {isUser ? "You" : "OKN Bot"}
            </span>
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              {formatTime(timestamp)}
            </span>
          </div>

          {/* Message */}
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {messageHtml ? (
              <div
                className={`markdown-content ${
                  isUser
                    ? "text-gray-900 dark:text-gray-100"
                    : "text-gray-800 dark:text-gray-200"
                }`}
                dangerouslySetInnerHTML={{ __html: messageHtml }}
              />
            ) : (
              <p className="text-gray-800 dark:text-gray-200 leading-relaxed m-0">
                {message}
              </p>
            )}

            {/* Streaming cursor */}
            {!isUser && !isComplete && (
              <span className="inline-block w-0.5 h-4 ml-0.5 bg-blue-500 rounded-sm animate-blink align-text-bottom" />
            )}
          </div>

          {/* Chart */}
          {chart && (
            <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <img
                src={chart}
                alt="Data visualization"
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Quick actions */}
          {quickActions && quickActions.length > 0 && isComplete && onQuickActionClick && (
            <QuickActionButtons
              actions={quickActions}
              onActionClick={onQuickActionClick}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
