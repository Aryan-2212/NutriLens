import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ServingSizeAdjusterProps {
  servingSize: number;
  onServingSizeChange: (value: number) => void;
  estimatedServing?: string;
  confidence?: string;
}

export const ServingSizeAdjuster = ({
  servingSize,
  onServingSizeChange,
  estimatedServing,
  confidence,
}: ServingSizeAdjusterProps) => {
  const getPortionLabel = (size: number): string => {
    if (size <= 0.5) return "Small portion";
    if (size <= 0.75) return "Half portion";
    if (size <= 1.25) return "Standard portion";
    if (size <= 1.75) return "Large portion";
    return "Extra large portion";
  };

  const getConfidenceBadgeVariant = (conf?: string) => {
    if (conf === "high") return "default";
    if (conf === "medium") return "secondary";
    return "outline";
  };

  const MIN = 0.25;
  const MAX = 3;
  const STEP = 0.25;
  const ticks = [MIN, 1, MAX];
  const getPercent = (v: number) => ((v - MIN) / (MAX - MIN)) * 100;
  const formatTick = (v: number) => (v === 0.25 ? "0.25x" : v === 1 ? "1.0x" : v === 3 ? "3.0x" : `${v}x`);

  return (
    <div className="space-y-4 p-4 rounded-lg bg-muted/50 border border-border">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <Label className="text-base font-semibold">Serving Size Adjustment</Label>
          {estimatedServing && (
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                AI Estimate: {estimatedServing}
              </p>
              {confidence && (
                <Badge variant={getConfidenceBadgeVariant(confidence)} className="text-xs">
                  {confidence} confidence
                </Badge>
              )}
            </div>
          )}
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="cursor-pointer hover:text-foreground transition-colors"
              aria-label="Serving size information"
            >
              <Info className="h-4 w-4 text-muted-foreground mt-1" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="max-w-xs">
            <p className="text-sm">
              Adjust the slider to match your actual portion size. The AI provides an initial estimate,
              but you can fine-tune it. All nutritional values will automatically recalculate based on your adjustment.
            </p>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">{getPortionLabel(servingSize)}</span>
          <span className="text-sm font-bold">{servingSize.toFixed(2)}x</span>
        </div>
        
        <Slider
          value={[servingSize]}
          onValueChange={(values) => onServingSizeChange(values[0])}
          min={MIN}
          max={MAX}
          step={STEP}
          className="w-full"
        />
        
        <div className="relative h-5 mt-1">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute -translate-x-1/2 text-xs text-muted-foreground"
              style={{ left: `${getPercent(t)}%` }}
            >
              {formatTick(t)}
            </span>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Adjust the slider to match your actual portion size. Nutritional values will update automatically.
      </p>
    </div>
  );
};
