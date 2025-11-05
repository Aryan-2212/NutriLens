import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { format, startOfDay, isToday, isYesterday } from "date-fns";

interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meal_type: string;
  logged_at: string;
  image_url?: string;
}

interface MealHistoryProps {
  meals: Meal[];
}

export const MealHistory = ({ meals }: MealHistoryProps) => {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [visibleDays, setVisibleDays] = useState(7);

  // Group meals by date
  const mealsByDate = meals.reduce((acc, meal) => {
    const dateKey = format(startOfDay(new Date(meal.logged_at)), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(meal);
    return acc;
  }, {} as Record<string, Meal[]>);

  // Sort dates in descending order (most recent first)
  const sortedDates = Object.keys(mealsByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  // Filter out today's date from history
  const historyDates = sortedDates.filter(date => !isToday(new Date(date)));

  const toggleDate = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isYesterday(date)) return "Yesterday";
    return format(date, "EEEE, MMMM d, yyyy");
  };

  const calculateDailyTotals = (dayMeals: Meal[]) => {
    return dayMeals.reduce(
      (acc, meal) => ({
        calories: acc.calories + Number(meal.calories),
        protein: acc.protein + Number(meal.protein),
        carbs: acc.carbs + Number(meal.carbs),
        fat: acc.fat + Number(meal.fat),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  if (historyDates.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Meal History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No meal history available yet. Start logging meals to build your history!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Meal History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {historyDates.slice(0, visibleDays).map((date) => {
          const dayMeals = mealsByDate[date];
          const totals = calculateDailyTotals(dayMeals);
          const isExpanded = expandedDates.has(date);

          return (
            <div key={date} className="border rounded-lg overflow-hidden bg-card">
              <Button
                variant="ghost"
                className="w-full justify-between p-4 h-auto hover:bg-accent/50"
                onClick={() => toggleDate(date)}
              >
                <div className="flex flex-col items-start gap-1">
                  <span className="font-semibold text-foreground">
                    {formatDateLabel(date)}
                  </span>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="font-medium text-primary">{Math.round(totals.calories)} cal</span>
                    <span>• {Math.round(totals.protein)}g protein</span>
                    <span>• {Math.round(totals.carbs)}g carbs</span>
                    <span>• {Math.round(totals.fat)}g fat</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {dayMeals.length} meal{dayMeals.length > 1 ? 's' : ''}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </Button>

              {isExpanded && (
                <div className="border-t bg-card/50 p-4 space-y-3">
                  {dayMeals.map((meal) => (
                    <div
                      key={meal.id}
                      className="flex justify-between items-center gap-4 p-3 rounded-lg border bg-background/50"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground">{meal.name}</h4>
                        <p className="text-sm text-muted-foreground mb-1">
                          <span className="capitalize">{meal.meal_type}</span>
                          {" • "}
                          <span className="text-xs">
                            {format(new Date(meal.logged_at), "h:mm a")}
                          </span>
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="text-primary font-medium">{Math.round(meal.calories)} cal</span>
                          <span className="text-muted-foreground">• {Math.round(meal.protein)}g protein</span>
                          <span className="text-muted-foreground">• {Math.round(meal.carbs)}g carbs</span>
                          <span className="text-muted-foreground">• {Math.round(meal.fat)}g fat</span>
                        </div>
                      </div>
                      {meal.image_url && (
                        <img
                          src={meal.image_url}
                          alt={meal.name}
                          className="w-16 h-16 rounded-lg object-cover shadow-soft"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        
        {historyDates.length > visibleDays && (
          <div className="pt-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setVisibleDays(prev => prev + 7)}
            >
              Load More History
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
