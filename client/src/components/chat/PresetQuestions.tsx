// src/components/chat/PresetQuestions.tsx
interface PresetQuestionsProps {
  onSelectQuestion: (question: string) => void;
  disabled?: boolean;
}

const PRESET_QUESTIONS = [
  {
    title: "Basic Statistics",
    question: "How many shooting incidents occurred in Chicago in 2024?",
    icon: "📊",
  },
  {
    title: "Temporal Patterns",
    question: "What are the monthly trends for fatal shootings in Chicago from 2020-2024?",
    icon: "📈",
  },
  {
    title: "Demographics",
    question: "What is the age distribution of shooting victims in Chicago?",
    icon: "👥",
  },
  {
    title: "Geographic Analysis",
    question: "Which census tracts in Philadelphia have the highest number of incidents?",
    icon: "🗺️",
  },
  {
    title: "Time Analysis",
    question: "Show me incidents that occurred between 10 PM and 2 AM in Philadelphia",
    icon: "🕙",
  },
  {
    title: "Demographic Comparison",
    question: "Compare demographic patterns (age, race, sex) between Chicago and Philadelphia shooting victims",
    icon: "📉",
  }
];

const PresetQuestions = ({ onSelectQuestion, disabled = false }: PresetQuestionsProps) => {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 text-center">
        Suggested questions
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PRESET_QUESTIONS.map((preset, index) => (
          <button
            key={index}
            onClick={() => onSelectQuestion(preset.question)}
            disabled={disabled}
            className="group relative flex items-start gap-3 p-4 rounded-[24px] border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 dark:disabled:hover:border-slate-700 disabled:hover:scale-100"
          >
            <span className="text-2xl flex-shrink-0 mt-0.5">{preset.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">
                {preset.title}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                {preset.question}
              </div>
            </div>
            <svg
              className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors flex-shrink-0 mt-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PresetQuestions;