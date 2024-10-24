// MainApp.tsx

import { useState } from "react";
import ChatBox from "./chat/ChatBox";
import { Card } from "@nextui-org/react";

const questions = [
  "How many fatal shootings occurred in 2023?",
  "Show me shootings that happened in July 2023.",
  "How have shootings changed over the past five years?",
];

const MainApp = (): JSX.Element => {
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [showQuestions, setShowQuestions] = useState(true);

  const handleQuestionClick = (question: string) => {
    setSelectedQuestion(question);
  };

  return (
    <div className="flex flex-col items-center justify-end w-full h-full p-4 overflow-hidden">
      <div className="w-full max-w-3xl mb-4">
        {showQuestions && (
          <div className="flex flex-col items-center mb-4">
            <p className="mb-2 text-black dark:text-white text-lg">
              Ask me anything about US gun violence. You can try:
            </p>
            <ul className="flex flex-wrap justify-center gap-2">
              {questions.map((q, i) => (
                <li key={i}>
                  <Card
                    onPress={() => handleQuestionClick(q)}
                    className="p-2"
                    isHoverable
                    isPressable
                  >
                    {q}
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        )}
        <ChatBox
          selectedQuestion={selectedQuestion}
          onQuestionSent={() => setSelectedQuestion("")}
          setShowQuestions={setShowQuestions}
        />
      </div>
    </div>
  );
};

export default MainApp;
