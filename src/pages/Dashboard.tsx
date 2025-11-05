import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo } from "@/components/Logo";
import { NutritionRing } from "@/components/NutritionRing";
import { ProteinRecommendations } from "@/components/ProteinRecommendations";
import { WeeklyProgress } from "@/components/WeeklyProgress";
import { MealHistory } from "@/components/MealHistory";
import { Plus, Camera, Edit, LogOut, Utensils, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  daily_calorie_goal: number;
  weight?: number;
  height?: number;
  age?: number;
  gender?: string;
  activity_level?: string;
  username?: string;
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
  const [weeklyMeals, setWeeklyMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    fiber: "",
    meal_type: "",
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    loadData();

    // Set up real-time subscription for meals
    const channel = supabase
      .channel('meals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meals',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Meal change detected:', payload);
          loadData(); // Refresh data on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

      // Load weekly meals (past 30 days for history)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);

      const { data: weeklyData, error: weeklyError } = await supabase
        .from("meals")
        .select("*")
        .eq("user_id", user.id)
        .gte("logged_at", thirtyDaysAgo.toISOString())
        .order("logged_at", { ascending: false });

      if (weeklyError) throw weeklyError;

      setWeeklyMeals(weeklyData || []);
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

  // Calculate macro targets based on user profile
  const calculateMacroTargets = () => {
    if (!profile || !profile.weight) {
      // Default targets if no profile data
      return {
        protein: 150,
        carbs: 200,
        fat: 60,
      };
    }

    const weight = profile.weight;
    const activityLevel = profile.activity_level || "moderately_active";

    // Protein: Based on activity level (g per kg body weight)
    const proteinMultipliers: Record<string, number> = {
      sedentary: 0.8,
      lightly_active: 1.2,
      moderately_active: 1.6,
      very_active: 2.0,
      extremely_active: 2.2,
    };
    const proteinPerKg = proteinMultipliers[activityLevel] || 1.6;
    const protein = Math.round(weight * proteinPerKg);

    // Fat: 25-30% of total calories (using 0.9-1.0g per kg body weight)
    const fat = Math.round(weight * 1.0);

    // Carbs: Remaining calories after protein and fat
    const proteinCals = protein * 4;
    const fatCals = fat * 9;
    const remainingCals = profile.daily_calorie_goal - proteinCals - fatCals;
    const carbs = Math.round(remainingCals / 4);

    return { protein, carbs, fat };
  };

  const { protein: recommendedProtein, carbs: recommendedCarbs, fat: recommendedFat } = calculateMacroTargets();

  const handleDeleteClick = (meal: Meal) => {
    setSelectedMeal(meal);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (meal: Meal) => {
    setSelectedMeal(meal);
    setEditFormData({
      name: meal.name,
      calories: meal.calories.toString(),
      protein: meal.protein.toString(),
      carbs: meal.carbs.toString(),
      fat: meal.fat.toString(),
      fiber: meal.fiber.toString(),
      meal_type: meal.meal_type,
    });
    setEditDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedMeal) return;

    try {
      const { error } = await supabase
        .from("meals")
        .delete()
        .eq("id", selectedMeal.id);

      if (error) throw error;

      toast.success("Meal deleted successfully!");
      loadData(); // Refresh the meals list
      setDeleteDialogOpen(false);
      setSelectedMeal(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete meal");
    }
  };

  const handleUpdate = async () => {
    if (!selectedMeal) return;

    setUpdating(true);

    try {
      const { error } = await supabase
        .from("meals")
        .update({
          name: editFormData.name,
          calories: parseFloat(editFormData.calories),
          protein: parseFloat(editFormData.protein) || 0,
          carbs: parseFloat(editFormData.carbs) || 0,
          fat: parseFloat(editFormData.fat) || 0,
          fiber: parseFloat(editFormData.fiber) || 0,
          meal_type: editFormData.meal_type,
        })
        .eq("id", selectedMeal.id);

      if (error) throw error;

      toast.success("Meal updated successfully!");
      loadData(); // Refresh the meals list
      setEditDialogOpen(false);
      setSelectedMeal(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update meal");
    } finally {
      setUpdating(false);
    }
  };

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
        {/* Welcome Message */}
        {profile?.username && (
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Hello {profile.username}, Welcome Back! 👋
            </h1>
            <p className="text-muted-foreground mt-2">Let's track your nutrition journey today</p>
          </div>
        )}

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
                    <div className="flex items-center gap-2">
                      {meal.image_url && (
                        <img
                          src={meal.image_url}
                          alt={meal.name}
                          className="w-20 h-20 rounded-lg object-cover shadow-soft"
                        />
                      )}
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(meal)}
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(meal)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Progress */}
        <WeeklyProgress meals={weeklyMeals} />

        {/* Meal History */}
        <MealHistory meals={weeklyMeals} />

        {/* Protein Recommendations */}
        <ProteinRecommendations weight={profile?.weight} />
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Meal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedMeal?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Meal Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Meal</DialogTitle>
            <DialogDescription>Update the details of your meal</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Meal Name</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-meal-type">Meal Type</Label>
              <Select
                value={editFormData.meal_type}
                onValueChange={(value) => setEditFormData({ ...editFormData, meal_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select meal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-calories">Calories</Label>
                <Input
                  id="edit-calories"
                  type="number"
                  value={editFormData.calories}
                  onChange={(e) => setEditFormData({ ...editFormData, calories: e.target.value })}
                  required
                  min="0"
                  step="0.1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-protein">Protein (g)</Label>
                <Input
                  id="edit-protein"
                  type="number"
                  value={editFormData.protein}
                  onChange={(e) => setEditFormData({ ...editFormData, protein: e.target.value })}
                  min="0"
                  step="0.1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-carbs">Carbs (g)</Label>
                <Input
                  id="edit-carbs"
                  type="number"
                  value={editFormData.carbs}
                  onChange={(e) => setEditFormData({ ...editFormData, carbs: e.target.value })}
                  min="0"
                  step="0.1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-fat">Fat (g)</Label>
                <Input
                  id="edit-fat"
                  type="number"
                  value={editFormData.fat}
                  onChange={(e) => setEditFormData({ ...editFormData, fat: e.target.value })}
                  min="0"
                  step="0.1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-fiber">Fiber (g)</Label>
              <Input
                id="edit-fiber"
                type="number"
                value={editFormData.fiber}
                onChange={(e) => setEditFormData({ ...editFormData, fiber: e.target.value })}
                min="0"
                step="0.1"
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={updating}>
                {updating ? "Updating..." : "Update Meal"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
