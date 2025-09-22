import { Card, CardBody } from "@heroui/react";
import { marked, type Token } from "marked";
import DOMPurify from "dompurify";
import { useState, useEffect, useRef } from "react";
import "../../styles/markdown.css";
import UserIcon from "../../icons/user.svg";
import OknBotIcon from "../../icons/okn-bot.svg";

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
            entry.target.classList.remove("opacity-0", "translate-y-4");
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

  // Choose a better background color for user messages
  // Using a lighter blue that works better with dark text
  const userBgColor = "bg-blue-500";
  // Or if you prefer to keep the current blue but ensure white text:
  // const userBgColor = "bg-blue-600";

  return (
    <div
      ref={bubbleRef}
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 opacity-0 translate-y-4 transition-all duration-150 ease-out`}
    >
      {!isUser && (
        <div className="mr-2 mt-1 flex-shrink-0">
          <img
            src={OknBotIcon.src}
            alt="OKN Bot"
            className="w-8 h-8 rounded-full"
          />
        </div>
      )}

      <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`text-xs text-gray-500 dark:text-gray-400 mb-1 ${isUser ? "text-right" : "text-left"}`}
        >
          <span className="font-medium">{isUser ? "You" : "OKN Bot"}</span>
          <span className="ml-1 text-gray-400 text-[10px]">
            {new Date(timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <Card
          className={`${
            isUser
              ? `${userBgColor} text-white border-blue-700`
              : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
          } border shadow-sm`}
        >
          <CardBody>
            {messageHtml ? (
              <div
                className={`markdown-content ${isUser ? "text-white" : "text-black dark:text-white"}`}
                dangerouslySetInnerHTML={{ __html: messageHtml }}
              />
            ) : (
              <p
                className={
                  isUser ? "text-white m-0" : "text-black dark:text-white m-0"
                }
              >
                {message}
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      {isUser && (
        <div className="ml-2 mt-1 flex-shrink-0">
          <img src={UserIcon.src} alt="User" className="w-8 h-8 rounded-full" />
        </div>
      )}
    </div>
  );
};

export default ChatBubble;
