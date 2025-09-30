import { marked, type Token } from "marked";
import DOMPurify from "dompurify";
import { useState, useEffect, useRef } from "react";
import "../../styles/markdown.css";
import OknBotIcon from "../../icons/okn-bot.svg";

const UserAvatar = () => (
  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="white"
      className="w-4 h-4"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
    </svg>
  </div>
);

const ChatBubble = ({
  message,
  isUser,
  timestamp,
}: {
  message: string;
  isUser: boolean;
  timestamp: number;
}) => {
  const [messageHtml, setMessageHtml] = useState("");
  const bubbleRef = useRef(null);

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

    // Add intersection observer for animation
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
            entry.target.classList.remove("opacity-0", "translate-y-2");
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

  return (
    <div
      ref={bubbleRef}
      className="opacity-0 translate-y-2 transition-all duration-300 ease-out py-4"
    >
      <div className="flex gap-3 items-start">
        {/* Avatar */}
        <div className="flex-shrink-0 mt-0.5">
          {isUser ? (
            <UserAvatar />
          ) : (
            <img
              src={OknBotIcon.src}
              alt="OKN Bot"
              className="w-7 h-7 rounded-full"
            />
          )}
        </div>

        {/* Message content */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Compact header */}
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              {isUser ? "You" : "OKN Bot"}
            </span>
            <span className="text-gray-400 dark:text-gray-500 text-[10px]">
              {new Date(timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {/* Message text - No bubble, just content like Claude */}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
