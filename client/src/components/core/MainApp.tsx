import { useState, useMemo, useRef } from "react";
import ChatBox from "../chat/ChatBox";
import {
  Card,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import type { SharedSelection } from "@heroui/react";
import type { ModelType } from "../../config/ws";
import KeyboardArrowDown from "../../icons/keyboard-arrow-down.svg";
import KeyboardArrowUp from "../../icons/keyboard-arrow-up.svg";

const regularQuestions = [
  "How many fatal shootings occurred in 2023?",
  "Show me shootings that happened in July 2023.",
  "How have shootings changed over the past five years?",
];

const sparqlQuestions = [
  "SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 50",
  "SELECT ?s ?p ?o WHERE { ?s ?p ?o . FILTER(isLiteral(?o)) } LIMIT 50",
  "SELECT ?s ?o WHERE { ?s ?p ?o . FILTER(CONTAINS(STR(?s), 'STATE') || CONTAINS(STR(?o), 'STATE')) } LIMIT 50",
];

const MainApp = () => {
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [showQuestions, setShowQuestions] = useState(true);
  const [isChatEmpty, setIsChatEmpty] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<ModelType>>(
    new Set(["Chat"]),
  );
  const chatResetRef = useRef<(() => void) | null>(null);

  const model = useMemo(
    () => Array.from(selectedKeys)[0] as ModelType,
    [selectedKeys],
  );

  const questions = model === "Chat" ? regularQuestions : sparqlQuestions;

  const getHeaderText = () => {
    if (model === "Chat") {
      return "Ask me anything about US gun violence. You can try:";
    }
    return "Beta Mode: This version uses knowledge graph data through SPARQL queries. Currently only accepts raw SPARQL queries. Try these examples:";
  };

  const handleQuestionClick = (question: string) => {
    setSelectedQuestion(question);
  };

  const handleRefresh = () => {
    setSelectedQuestion("");
    setShowQuestions(true);
    setIsChatEmpty(true);
    chatResetRef.current?.();
  };

  const handleSelectionChange = (keys: SharedSelection) => {
    const newKey = Array.from(keys)[0] as ModelType;
    setSelectedKeys(new Set([newKey]));
    handleRefresh(); // Reset everything when model changes
  };

  return (
    <>
      <div className="absolute top-20 left-4 z-50 w-auto">
        <Dropdown
          className="w-48"
          onOpenChange={(isOpen) => setIsDropdownOpen(isOpen)}
        >
          <DropdownTrigger variant="light">
            <Button className="capitalize w-full flex items-center justify-between">
              <span>{model === "Chat" ? "OKN AI" : "OKN AI (beta)"}</span>
              <img
                src={
                  isDropdownOpen ? KeyboardArrowUp.src : KeyboardArrowDown.src
                }
                alt={isDropdownOpen ? "Collapse" : "Expand"}
                className="w-4 h-4"
              />
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            className="w-48"
            aria-label="Dropdown Variants"
            disallowEmptySelection
            selectionMode="single"
            selectedKeys={selectedKeys}
            onSelectionChange={handleSelectionChange}
          >
            <DropdownItem key="Chat">OKN AI</DropdownItem>
            <DropdownItem key="SPARQL">OKN AI (beta)</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>

      <div className="flex flex-col items-center justify-end w-full h-full p-4 overflow-hidden">
        <div className="w-full max-w-3xl mb-4">
          {showQuestions && (
            <div className="flex flex-col items-center mb-4">
              <p className="mb-2 text-black dark:text-white text-lg">
                {getHeaderText()}
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
            onChatStateChange={(isEmpty: boolean) => setIsChatEmpty(isEmpty)}
            onResetChat={(resetFn) => {
              chatResetRef.current = resetFn;
            }}
            selectedModel={model}
          />
        </div>
      </div>
    </>
  );
};

export default MainApp;
