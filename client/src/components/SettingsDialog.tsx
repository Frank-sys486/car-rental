import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Download, Upload, Database, Settings, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getVehicles, getBookings, createVehicle, createBooking } from "@/lib/data";
import type { Vehicle, Booking } from "@shared/schema";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const defaultConfig: FirebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [config, setConfig] = useState<FirebaseConfig>(defaultConfig);
  const [activeTab, setActiveTab] = useState<'firebase' | 'data'>('firebase');
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("firebase_config");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfig({ ...defaultConfig, ...parsed });
      } catch (e) {
        // Ignore invalid JSON
      }
    }
  }, [open]);

  const handleSave = () => {
    const isConfigured = Object.values(config).some(v => v.trim() !== "");
    
    if (isConfigured) {
      localStorage.setItem("firebase_config", JSON.stringify(config));
    } else {
      localStorage.removeItem("firebase_config");
    }
    window.location.reload(); // Reload to apply changes
  };

  const handleExport = async () => {
    try {
      const vehicles = await getVehicles();
      const bookings = await getBookings();
      const data = { vehicles, bookings, exportDate: new Date().toISOString() };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `car-rental-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Export Successful", description: "Data has been downloaded." });
    } catch (error) {
      toast({ title: "Export Failed", description: "Could not export data.", variant: "destructive" });
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        if (!Array.isArray(json.vehicles) || !Array.isArray(json.bookings)) {
          throw new Error("Invalid backup format");
        }

        const idMap = new Map<string, string>();
        let vehicleCount = 0;
        let bookingCount = 0;

        // Import Vehicles
        for (const v of json.vehicles) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, nextAvailableDate, ...rest } = v;
          const newVehicle = await createVehicle(rest);
          idMap.set(v.id, newVehicle.id);
          vehicleCount++;
        }

        // Import Bookings
        for (const b of json.bookings) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, vehicleId, ...rest } = b;
          const newVehicleId = idMap.get(vehicleId);
          
          // Only import booking if the vehicle exists (or was just created)
          if (newVehicleId) {
            await createBooking({ ...rest, vehicleId: newVehicleId });
            bookingCount++;
          }
        }

        toast({ 
          title: "Import Successful", 
          description: `Imported ${vehicleCount} vehicles and ${bookingCount} bookings.` 
        });
        
        // Refresh page to show new data
        setTimeout(() => window.location.reload(), 1500);

      } catch (err) {
        console.error(err);
        toast({ title: "Import Failed", description: "Invalid file format or data error.", variant: "destructive" });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Manage application configuration and data.</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 border-b mb-4">
          <Button 
            variant={activeTab === 'firebase' ? "secondary" : "ghost"} 
            onClick={() => setActiveTab('firebase')}
            className="rounded-b-none"
          >
            <Settings className="w-4 h-4 mr-2" /> Firebase
          </Button>
          <Button 
            variant={activeTab === 'data' ? "secondary" : "ghost"} 
            onClick={() => setActiveTab('data')}
            className="rounded-b-none"
          >
            <Database className="w-4 h-4 mr-2" /> Data Management
          </Button>
        </div>

        {activeTab === 'firebase' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Reload Required</p>
                <p className="opacity-90">Saving settings will reload the application to initialize the connection.</p>
              </div>
            </div>

            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input id="apiKey" value={config.apiKey} onChange={(e) => setConfig({...config, apiKey: e.target.value})} placeholder="AIza..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="authDomain">Auth Domain</Label>
                  <Input id="authDomain" value={config.authDomain} onChange={(e) => setConfig({...config, authDomain: e.target.value})} placeholder="project.firebaseapp.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectId">Project ID</Label>
                  <Input id="projectId" value={config.projectId} onChange={(e) => setConfig({...config, projectId: e.target.value})} placeholder="project-id" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storageBucket">Storage Bucket</Label>
                  <Input id="storageBucket" value={config.storageBucket} onChange={(e) => setConfig({...config, storageBucket: e.target.value})} placeholder="project.appspot.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="messagingSenderId">Messaging Sender ID</Label>
                  <Input id="messagingSenderId" value={config.messagingSenderId} onChange={(e) => setConfig({...config, messagingSenderId: e.target.value})} placeholder="123456789" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appId">App ID</Label>
                  <Input id="appId" value={config.appId} onChange={(e) => setConfig({...config, appId: e.target.value})} placeholder="1:123456789:web:..." />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save & Reload</Button>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="space-y-6 py-4">
            <div className="grid gap-6">
              <div className="space-y-2">
                <h3 className="font-medium flex items-center gap-2"><Download className="w-4 h-4" /> Export Data</h3>
                <p className="text-sm text-muted-foreground">Download a backup of all vehicles and bookings as a JSON file.</p>
                <Button variant="outline" onClick={handleExport}>Export Backup</Button>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium flex items-center gap-2"><Upload className="w-4 h-4" /> Import Data</h3>
                <p className="text-sm text-muted-foreground">Restore data from a backup file. This will add to existing data.</p>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                  >
                    {isImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {isImporting ? "Importing..." : "Select Backup File"}
                  </Button>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept=".json"
                    onChange={handleImport}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}