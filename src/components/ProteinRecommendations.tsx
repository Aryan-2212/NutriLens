import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

interface ProteinRecommendationsProps {
  weight?: number;
}

export const ProteinRecommendations = ({ weight }: ProteinRecommendationsProps) => {
  const recommendedProtein = weight ? Math.round(weight * 0.8) : 56;

  const proteinFoods = [
    { name: "Paneer (100g)", protein: "~18g protein" },
    { name: "Dal/Lentils (1 cup)", protein: "~18g protein" },
    { name: "Chickpeas (1 cup)", protein: "~15g protein" },
    { name: "Greek Yogurt (1 cup)", protein: "~20g protein" },
    { name: "Eggs (2 large)", protein: "~12g protein" },
    { name: "Chicken Breast (100g)", protein: "~31g protein" },
  ];

  return (
    <Card className="shadow-strong">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          <CardTitle>Protein Recommendations</CardTitle>
        </div>
        <CardDescription>General guidelines for Indian adults</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Daily Protein Intake */}
        <div>
          <h3 className="font-semibold text-foreground mb-2">Daily Protein Intake</h3>
          <p className="text-sm text-muted-foreground">
            The recommended daily protein intake for adults is approximately{" "}
            <span className="text-primary font-medium">0.8 grams per kilogram</span> of body weight.
            {weight && (
              <span>
                {" "}
                For example, a {weight}kg adult should aim for around {recommendedProtein}g of protein per day.
              </span>
            )}
          </p>
        </div>

        {/* Protein-Rich Indian Foods */}
        <div>
          <h3 className="font-semibold text-foreground mb-3">Protein-Rich Indian Foods</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {proteinFoods.map((food) => (
              <div
                key={food.name}
                className="p-3 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors"
              >
                <p className="font-medium text-sm">{food.name}</p>
                <p className="text-xs text-muted-foreground">{food.protein}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
