import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
}

export const WeeklyProgress = ({ meals }: WeeklyProgressProps) => {
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

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
      <CardHeader>
        <CardTitle className="text-foreground">Weekly Progress</CardTitle>
        <p className="text-sm text-muted-foreground">
          Average daily intake: <span className="font-bold text-primary">{avgCalories} kcal</span>
        </p>
      </CardHeader>
      <CardContent>
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
              dataKey="calories" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Calories"
              dot={{ fill: "hsl(var(--primary))", r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="protein" 
              stroke="hsl(0 84% 60%)" 
              strokeWidth={2}
              name="Protein (g)"
              dot={{ fill: "hsl(0 84% 60%)", r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="carbs" 
              stroke="hsl(48 96% 53%)" 
              strokeWidth={2}
              name="Carbs (g)"
              dot={{ fill: "hsl(48 96% 53%)", r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="fat" 
              stroke="hsl(24 95% 53%)" 
              strokeWidth={2}
              name="Fat (g)"
              dot={{ fill: "hsl(24 95% 53%)", r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
