interface NutritionRingProps {
  value: number;
  max: number;
  label: string;
  color: string;
  size?: "sm" | "md" | "lg";
}

export const NutritionRing = ({ value, max, label, color, size = "md" }: NutritionRingProps) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const sizeClasses = {
    sm: "w-20 h-20",
    md: "w-28 h-28",
    lg: "w-36 h-36",
  };

  const strokeWidthClasses = {
    sm: 6,
    md: 8,
    lg: 10,
  } as const;

  const VIEWBOX_SIZE = 120;
  const center = VIEWBOX_SIZE / 2;
  const strokeW = strokeWidthClasses[size];
  const padding = 6; // prevent stroke from clipping
  const radius = center - strokeW / 2 - padding;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`${sizeClasses[size]} relative`}>
        <svg 
          className="transform -rotate-90 overflow-visible" 
          viewBox="0 0 120 120"
          style={{ width: '100%', height: '100%' }}
        >
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidthClasses[size]}
          />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidthClasses[size]}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-foreground">{Math.round(value)}</span>
          <span className="text-xs text-muted-foreground">/ {max}</span>
        </div>
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </div>
  );
};
