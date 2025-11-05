import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { NutritionRing } from "@/components/NutritionRing";
import { ProteinRecommendations } from "@/components/ProteinRecommendations";
import { Plus, Camera, Edit, LogOut, Utensils } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  daily_calorie_goal: number;
  weight?: number;
}

interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  meal_type: string;
  logged_at: string;
  image_url?: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [todaysMeals, setTodaysMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        if (profileError.code === "PGRST116") {
          navigate("/profile-setup");
          return;
        }
        throw profileError;
      }

      setProfile(profileData);

      // Load today's meals
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: mealsData, error: mealsError } = await supabase
        .from("meals")
        .select("*")
        .eq("user_id", user.id)
        .gte("logged_at", today.toISOString())
        .order("logged_at", { ascending: false });

      if (mealsError) throw mealsError;

      setTodaysMeals(mealsData || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const totals = todaysMeals.reduce(
    (acc, meal) => ({
      calories: acc.calories + Number(meal.calories),
      protein: acc.protein + Number(meal.protein),
      carbs: acc.carbs + Number(meal.carbs),
      fat: acc.fat + Number(meal.fat),
      fiber: acc.fiber + Number(meal.fiber),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  const recommendedProtein = profile ? Math.round(profile.daily_calorie_goal * 0.3 / 4) : 150;
  const recommendedCarbs = profile ? Math.round(profile.daily_calorie_goal * 0.4 / 4) : 200;
  const recommendedFat = profile ? Math.round(profile.daily_calorie_goal * 0.3 / 9) : 60;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your nutrition data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Logo size="sm" />
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile-setup")}>
              <Edit className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Today's Summary */}
        <Card className="shadow-strong">
          <CardHeader>
            <CardTitle>Today's Nutrition</CardTitle>
            <CardDescription>Track your daily intake and stay on target</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 justify-items-center">
              <NutritionRing
                value={totals.calories}
                max={profile?.daily_calorie_goal || 2000}
                label="Calories"
                color="hsl(var(--primary))"
                size="lg"
              />
              <NutritionRing
                value={totals.protein}
                max={recommendedProtein}
                label="Protein (g)"
                color="hsl(var(--nutrition-protein))"
              />
              <NutritionRing
                value={totals.carbs}
                max={recommendedCarbs}
                label="Carbs (g)"
                color="hsl(var(--nutrition-carbs))"
              />
              <NutritionRing
                value={totals.fat}
                max={recommendedFat}
                label="Fat (g)"
                color="hsl(var(--nutrition-fat))"
              />
            </div>
          </CardContent>
        </Card>

        {/* Meal Logging Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            size="lg"
            className="h-24 text-lg"
            onClick={() => navigate("/log-meal?type=manual")}
          >
            <Plus className="mr-2 h-6 w-6" />
            Manual Entry
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="h-24 text-lg"
            onClick={() => navigate("/log-meal?type=scan")}
          >
            <Camera className="mr-2 h-6 w-6" />
            Scan Food
          </Button>
        </div>

        {/* Today's Meals */}
        <Card className="shadow-strong">
          <CardHeader>
            <CardTitle>Today's Meals</CardTitle>
            <CardDescription>
              {todaysMeals.length === 0
                ? "No meals logged yet today"
                : `${todaysMeals.length} meal${todaysMeals.length > 1 ? "s" : ""} logged`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todaysMeals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Utensils className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Start logging your meals to track your nutrition!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todaysMeals.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex justify-between items-center gap-4 p-4 rounded-lg border bg-card hover:shadow-soft transition-shadow"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg">{meal.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        <span className="capitalize">{meal.meal_type}</span>
                        {" • "}
                        <span className="text-xs">
                          {new Date(meal.logged_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-3 text-sm">
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
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0 shadow-soft"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Protein Recommendations */}
        <ProteinRecommendations weight={profile?.weight} />
      </main>
    </div>
  );
};

export default Dashboard;
