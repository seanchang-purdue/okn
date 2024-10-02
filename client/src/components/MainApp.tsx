import { useState } from "react";
import { Button, Textarea } from "@nextui-org/react";
import { SearchIcon } from "../icons/search.jsx";
import { SendIcon } from "../icons/send.jsx";

const questions = [
  "What are the most common time of day for gun violence?",
  "Can you show me the most dangerous cities in the US?",
  "Is there some patterns related to gun violence in the US?",
];

const MainApp = (): JSX.Element => {
  const [searchValue, setSearchValue] = useState("");

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
  };

  const handleQuestionClick = (question: string) => {
    setSearchValue(question);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (
    event,
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  const handleSubmit = (
    event:
      | React.FormEvent<HTMLFormElement>
      | React.KeyboardEvent<HTMLInputElement>,
  ) => {
    event.preventDefault();
    if (searchValue.trim()) {
      console.log(searchValue);
      setSearchValue("");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen gap-y-8">
      <p>Ask me anything about US gun violence. You can try:</p>
      <ul className="flex flex-row items-center justify-center gap-x-2">
        {questions.map((q, i) => (
          <li
            key={i}
            className="p-4 w-64 bg-slate-100 hover:bg-slate-200 hover:shadow-sm active:bg-slate-300 transition duration-150 rounded-lg hover:cursor-pointer"
            onClick={() => handleQuestionClick(q)}
          >
            {q}
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit} className="2xl:w-1/3 w-1/2">
        <Textarea
          label="Question"
          placeholder="What's on your mind?"
          value={searchValue}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          endContent={
            <Button type="submit" variant="light" isIconOnly>
              <SendIcon className="text-black/50 mb-0.5 dark:text-white/90 text-slate-400 flex-shrink-0 w-8 h-8" />
            </Button>
          }
        />
      </form>
    </div>
  );
};

export default MainApp;
