import { useMemo, useState } from "react";
import { PRESET_QUESTION_BANK } from "../../data/presetQuestions";

interface PresetQuestionsProps {
  onSelectQuestion: (question: string) => void;
  disabled?: boolean;
}

const SAMPLE_SIZE = 6;

// Deterministic daily sampling utilities
const dateKey = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`; // local date key
};

// xfnv1a hash -> 32-bit seed
function xfnv1a(str: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

// Mulberry32 PRNG from 32-bit seed
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededSampleUnique<T>(arr: T[], k: number, seedStr: string): T[] {
  const n = arr.length;
  if (k >= n) return arr.slice();
  const seed = xfnv1a(seedStr);
  const rand = mulberry32(seed);
  const indices = Array.from({ length: n }, (_, i) => i);
  // Fisher–Yates with seeded random
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, k).map((i) => arr[i]);
}

const PresetQuestions = ({
  onSelectQuestion,
  disabled = false,
}: PresetQuestionsProps) => {
  const [category, setCategory] = useState<string>("All");
  const [shuffle, setShuffle] = useState(0);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const q of PRESET_QUESTION_BANK) set.add(q.category);
    return ["All", ...Array.from(set)];
  }, []);

  const filtered = useMemo(() => {
    return category === "All"
      ? PRESET_QUESTION_BANK
      : PRESET_QUESTION_BANK.filter((q) => q.category === category);
  }, [category]);

  const presets = useMemo(() => {
    const seed = `${dateKey()}|${category}|${shuffle}`;
    return seededSampleUnique(filtered, SAMPLE_SIZE, seed);
  }, [filtered, category, shuffle]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 text-center">
        Suggested questions
      </h3>
      {/* Category filter + shuffle */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                category === c
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-slate-700 hover:border-blue-400"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShuffle((s) => s + 1)}
          className="ml-3 px-3 py-1.5 rounded-md text-xs border border-gray-200 dark:border-slate-700 hover:border-blue-400 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200"
        >
          🔀 Shuffle
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {presets.map((preset, index) => (
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
