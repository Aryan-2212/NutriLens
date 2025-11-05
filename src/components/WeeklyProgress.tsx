import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

interface Meal {
  logged_at: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface WeeklyProgressProps {
  meals: Meal[];
  isUpdating?: boolean;
}

export const WeeklyProgress = ({ meals, isUpdating = false }: WeeklyProgressProps) => {
  const [activeTab, setActiveTab] = useState("calories");

  // Generate data for the past 7 days
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = startOfDay(subDays(new Date(), 6 - i));
    const dateStr = format(date, 'yyyy-MM-dd');
    
    const dayMeals = meals.filter(meal => {
      const mealDate = format(new Date(meal.logged_at), 'yyyy-MM-dd');
      return mealDate === dateStr;
    });

    const totals = dayMeals.reduce(
      (acc, meal) => ({
        calories: acc.calories + Number(meal.calories),
        protein: acc.protein + Number(meal.protein),
        carbs: acc.carbs + Number(meal.carbs),
        fat: acc.fat + Number(meal.fat),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return {
      date: format(date, 'EEE'),
      fullDate: dateStr,
      ...totals,
    };
  });

  const avgCalories = Math.round(
    weeklyData.reduce((sum, day) => sum + day.calories, 0) / 7
  );
  const avgProtein = Math.round(
    weeklyData.reduce((sum, day) => sum + day.protein, 0) / 7
  );
  const avgCarbs = Math.round(
    weeklyData.reduce((sum, day) => sum + day.carbs, 0) / 7
  );
  const avgFat = Math.round(
    weeklyData.reduce((sum, day) => sum + day.fat, 0) / 7
  );

  const renderChart = (dataKey: string, color: string, label: string) => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={weeklyData}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis 
          dataKey="date" 
          stroke="hsl(var(--muted-foreground))"
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))"
          style={{ fontSize: '12px' }}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey={dataKey}
          stroke={color}
          strokeWidth={3}
          name={label}
          dot={{ fill: color, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <Card className={`bg-card/50 backdrop-blur-sm border-primary/10 transition-all duration-500 ${isUpdating ? 'animate-pulse ring-2 ring-primary/50' : ''}`}>
      <CardHeader>
        <CardTitle className="text-foreground">Weekly Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="calories">Calories</TabsTrigger>
            <TabsTrigger value="protein">Protein</TabsTrigger>
            <TabsTrigger value="carbs">Carbs</TabsTrigger>
            <TabsTrigger value="fat">Fat</TabsTrigger>
          </TabsList>

          <TabsContent value="calories" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Average daily intake: <span className="font-bold text-primary">{avgCalories} kcal</span>
            </p>
            {renderChart("calories", "hsl(var(--primary))", "Calories")}
          </TabsContent>

          <TabsContent value="protein" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Average daily intake: <span className="font-bold" style={{ color: "hsl(0 84% 60%)" }}>{avgProtein} g</span>
            </p>
            {renderChart("protein", "hsl(0 84% 60%)", "Protein (g)")}
          </TabsContent>

          <TabsContent value="carbs" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Average daily intake: <span className="font-bold" style={{ color: "hsl(48 96% 53%)" }}>{avgCarbs} g</span>
            </p>
            {renderChart("carbs", "hsl(48 96% 53%)", "Carbs (g)")}
          </TabsContent>

          <TabsContent value="fat" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Average daily intake: <span className="font-bold" style={{ color: "hsl(24 95% 53%)" }}>{avgFat} g</span>
            </p>
            {renderChart("fat", "hsl(24 95% 53%)", "Fat (g)")}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
