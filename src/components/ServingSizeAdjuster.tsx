import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";

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
        <Info className="h-4 w-4 text-muted-foreground mt-1" />
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">{getPortionLabel(servingSize)}</span>
          <span className="text-sm font-bold">{servingSize.toFixed(2)}x</span>
        </div>
        
        <Slider
          value={[servingSize]}
          onValueChange={(values) => onServingSizeChange(values[0])}
          min={0.25}
          max={3}
          step={0.25}
          className="w-full"
        />
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0.25x</span>
          <span>1.0x</span>
          <span>3.0x</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Adjust the slider to match your actual portion size. Nutritional values will update automatically.
      </p>
    </div>
  );
};
