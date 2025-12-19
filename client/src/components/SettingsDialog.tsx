import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [jsonConfig, setJsonConfig] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem("firebase_config");
    if (saved) setJsonConfig(saved);
  }, [open]);

  const handleSave = () => {
    try {
      if (jsonConfig.trim()) {
        JSON.parse(jsonConfig); // Validate JSON
        localStorage.setItem("firebase_config", jsonConfig);
      } else {
        localStorage.removeItem("firebase_config");
      }
      window.location.reload(); // Reload to apply changes
    } catch (e) {
      toast({ title: "Error", description: "Invalid JSON format", variant: "destructive" });
      return;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Firebase Configuration</DialogTitle>
          <DialogDescription>
            Paste your Firebase Client Configuration JSON here to enable persistent storage.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-3 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Reload Required</p>
              <p className="opacity-90">Saving settings will reload the application to initialize the connection.</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Client Config JSON</label>
            <textarea
              className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
              placeholder='{ "apiKey": "...", "authDomain": "...", "projectId": "..." }'
              value={jsonConfig}
              onChange={(e) => setJsonConfig(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>
            Save & Reload
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}