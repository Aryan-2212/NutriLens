import logo from "@/assets/nutrilens-logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export const Logo = ({ size = "md", showText = true }: LogoProps) => {
  const sizeClasses = {
    sm: "h-8",
    md: "h-12",
    lg: "h-16",
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <div className="flex items-center gap-3">
      <img 
        src={logo} 
        alt="NutriLens Logo" 
        className={`${sizeClasses[size]} w-auto rounded-full shadow-soft`}
      />
      {showText && (
        <span className={`${textSizeClasses[size]} font-bold text-foreground`}>
          Nutri<span className="text-primary">Lens</span>
        </span>
      )}
    </div>
  );
};
