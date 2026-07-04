import * as React from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDictionary } from "@/app/[lang]/lang-provider";

export interface AiInputProps extends React.ComponentProps<"input"> {
  onValueChange?: (val: string) => void;
}

const AiInput = React.forwardRef<HTMLInputElement, AiInputProps>(
  ({ className, onValueChange, value, onChange, ...props }, ref) => {
    const [isEnhancing, setIsEnhancing] = React.useState(false);
    const dict = useDictionary();

    const handleEnhance = async (e: React.MouseEvent) => {
      e.preventDefault();
      
      const textToEnhance = typeof value === 'string' ? value : props.defaultValue?.toString() || "";
      if (!textToEnhance.trim()) return;

      setIsEnhancing(true);
      try {
        const res = await fetch("/api/enhance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textToEnhance }),
        });

        if (!res.ok) throw new Error("Failed to enhance text");

        const data = await res.json();
        const refined = data.text;
        
        if (refined) {
          if (onValueChange) {
            onValueChange(refined);
          } else if (onChange) {
            // Create a synthetic event
            const event = {
              target: { value: refined }
            } as React.ChangeEvent<HTMLInputElement>;
            onChange(event);
          }
          toast.success((dict as any)["common.aiEnhanced"] || "Text enhanced by AI!");
        }
      } catch (error) {
        console.error(error);
        toast.error((dict as any)["common.somethingWentWrong"] || "Something went wrong.");
      } finally {
        setIsEnhancing(false);
      }
    };

    return (
      <div className="relative w-full">
        <Input
          className={cn("pr-10", className)}
          value={value}
          onChange={onChange}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          onClick={handleEnhance}
          disabled={isEnhancing || !value}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
          title={(dict as any)["common.enhanceText"] || "Enhance text with AI"}
        >
          {isEnhancing ? (
            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
        </button>
      </div>
    );
  }
);
AiInput.displayName = "AiInput";

export { AiInput };
