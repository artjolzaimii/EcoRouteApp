interface Props {
  current: number;
  steps: string[];
}

export default function StepIndicator({ current, steps }: Props) {
  return (
    <div className="flex items-start">
      {steps.map((label, i) => {
        const num = i + 1;
        const done = num < current;
        const active = num === current;

        return (
          <div key={num} className="flex-1 flex items-center">
            <div className="flex flex-col items-center min-w-0">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 transition-colors ${
                  done
                    ? "bg-brand text-white"
                    : active
                    ? "bg-brand text-white ring-4 ring-brand/20"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {done ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  num
                )}
              </div>
              <span
                className={`text-xs mt-1.5 font-medium text-center leading-tight ${
                  active ? "text-brand" : done ? "text-gray-600" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mb-5 mx-2 transition-colors ${
                  num < current ? "bg-brand" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
