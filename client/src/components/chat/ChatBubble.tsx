import { Card, CardBody } from "@nextui-org/react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { useState, useEffect } from "react";
import "../../styles/markdown.css";

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

  useEffect(() => {
    const parseMessage = async () => {
      const markedOptions = {
        breaks: true,
        gfm: true,
      };

      const parsedMessage = await marked.parse(message, markedOptions);
      const sanitizedMessage = DOMPurify.sanitize(parsedMessage);

      setMessageHtml(sanitizedMessage);
    };

    parseMessage();
  }, [message]);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`max-w-2/3 ${isUser ? "items-end" : "items-start"}`}>
      <div className={`text-xs text-gray-500 dark:text-gray-400 mb-1 ${isUser ? "text-right" : "text-left"}`}>
          {isUser ? "You" : "OKN Bot"} - {new Date(timestamp).toLocaleTimeString()}
        </div>
        <Card className="bg-slate-100 dark:bg-slate-800">
          <CardBody>
            {messageHtml ? (
              <p
                className="text-black dark:text-white markdown-content"
                dangerouslySetInnerHTML={{ __html: messageHtml }}
              />
            ) : (
              <p className="text-black dark:text-white">{message}</p>
            )}
          </CardBody>
        </Card>

      </div>
    </div>
  );
};

export default ChatBubble;
