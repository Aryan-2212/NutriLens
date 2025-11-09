import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Camera, Upload } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ServingSizeAdjuster } from "@/components/ServingSizeAdjuster";

const LogMeal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "manual";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    fiber: "",
    meal_type: "",
  });
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Serving size state
  const [servingSize, setServingSize] = useState(1.0);
  const [baseNutrition, setBaseNutrition] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  });
  const [estimatedServing, setEstimatedServing] = useState<string>("");
  const [servingUnit, setServingUnit] = useState<string>("");
  const [confidence, setConfidence] = useState<string>("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!image || !user) return;

    setAnalyzing(true);
    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.readAsDataURL(image);
      
      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        const { data, error } = await supabase.functions.invoke("analyze-food", {
          body: { image: base64Image },
        });

        if (error) throw error;

        if (data.error) {
          toast.error(data.error);
          return;
        }

        // Store base nutrition values
        const baseCalories = data.calories || 0;
        const baseProtein = data.protein || 0;
        const baseCarbs = data.carbs || 0;
        const baseFat = data.fat || 0;
        const baseFiber = data.fiber || 0;

        setBaseNutrition({
          calories: baseCalories,
          protein: baseProtein,
          carbs: baseCarbs,
          fat: baseFat,
          fiber: baseFiber,
        });

        // Store serving size info
        const aiServingSize = data.serving_size || 1.0;
        setServingSize(aiServingSize);
        setEstimatedServing(data.estimated_serving || `${aiServingSize} ${data.serving_unit || "servings"}`);
        setServingUnit(data.serving_unit || "servings");
        setConfidence(data.confidence || "medium");

        // Update form with AI results (already adjusted by AI's serving size estimate)
        setFormData({
          name: data.name || "",
          calories: baseCalories.toString(),
          protein: baseProtein.toString(),
          carbs: baseCarbs.toString(),
          fat: baseFat.toString(),
          fiber: baseFiber.toString(),
          meal_type: formData.meal_type,
        });

        toast.success("Image analyzed successfully! Adjust serving size if needed.");
      };
    } catch (error: any) {
      toast.error(error.message || "Failed to analyze image");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleServingSizeChange = (newSize: number) => {
    setServingSize(newSize);
    
    // Recalculate nutrition values based on new serving size
    const ratio = newSize / 1.0; // Adjust from base (1.0x)
    
    setFormData(prev => ({
      ...prev,
      calories: (baseNutrition.calories * ratio).toFixed(1),
      protein: (baseNutrition.protein * ratio).toFixed(1),
      carbs: (baseNutrition.carbs * ratio).toFixed(1),
      fat: (baseNutrition.fat * ratio).toFixed(1),
      fiber: (baseNutrition.fiber * ratio).toFixed(1),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    setLoading(true);

    try {
      let imageUrl: string | null = null;

      // Upload image to storage if present
      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('meal-images')
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('meal-images')
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }

      const { error } = await supabase.from("meals").insert({
        user_id: user.id,
        name: formData.name,
        calories: parseFloat(formData.calories),
        protein: parseFloat(formData.protein) || 0,
        carbs: parseFloat(formData.carbs) || 0,
        fat: parseFloat(formData.fat) || 0,
        fiber: parseFloat(formData.fiber) || 0,
        meal_type: formData.meal_type,
        logged_at: new Date().toISOString(),
        image_url: imageUrl,
        serving_size: servingSize,
        estimated_serving: estimatedServing,
        serving_unit: servingUnit,
      });

      if (error) throw error;

      toast.success("Meal logged successfully!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to log meal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Logo size="sm" />
          <div className="w-10" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto shadow-strong">
          <CardHeader>
            <CardTitle>Log Your Meal</CardTitle>
            <CardDescription>
              {type === "scan"
                ? "Take a photo or upload an image to analyze nutrition"
                : "Manually enter meal details"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {type === "scan" && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    {imagePreview ? (
                      <div className="space-y-4">
                        <img
                          src={imagePreview}
                          alt="Food preview"
                          className="max-h-64 mx-auto rounded-lg"
                        />
                        <div className="flex gap-2 justify-center">
                          <Button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            variant="outline"
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Change Image
                          </Button>
                          <Button
                            type="button"
                            onClick={analyzeImage}
                            disabled={analyzing}
                          >
                            <Camera className="mr-2 h-4 w-4" />
                            {analyzing ? "Analyzing..." : "Analyze Food"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Camera className="h-16 w-16 mx-auto text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground mb-2">
                            Upload an image of your meal
                          </p>
                          <Button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Choose Image
                          </Button>
                        </div>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                  
                  {/* Serving Size Adjuster - show after analysis */}
                  {estimatedServing && (
                    <ServingSizeAdjuster
                      servingSize={servingSize}
                      onServingSizeChange={handleServingSizeChange}
                      estimatedServing={estimatedServing}
                      confidence={confidence}
                    />
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Meal Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Chicken Biryani"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meal_type">Meal Type</Label>
                <Select
                  value={formData.meal_type}
                  onValueChange={(value) => setFormData({ ...formData, meal_type: value })}
                  required
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
                  <Label htmlFor="calories">Calories</Label>
                  <Input
                    id="calories"
                    type="number"
                    placeholder="500"
                    value={formData.calories}
                    onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                    required
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="protein">Protein (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    placeholder="30"
                    value={formData.protein}
                    onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="carbs">Carbs (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    placeholder="50"
                    value={formData.carbs}
                    onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fat">Fat (g)</Label>
                  <Input
                    id="fat"
                    type="number"
                    placeholder="15"
                    value={formData.fat}
                    onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fiber">Fiber (g)</Label>
                <Input
                  id="fiber"
                  type="number"
                  placeholder="5"
                  value={formData.fiber}
                  onChange={(e) => setFormData({ ...formData, fiber: e.target.value })}
                  min="0"
                  step="0.1"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging Meal..." : "Log Meal"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default LogMeal;
