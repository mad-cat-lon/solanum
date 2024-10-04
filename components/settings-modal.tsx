import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirestore, useUser } from 'reactfire';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { toast } from "@/components/ui/use-toast";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { HexColorPicker } from "react-colorful";

import { Activity, Settings, defaultCategories, defaultSettings } from "@/types/common";


const generateRandomHexColor = () => {
  const red = Math.floor(Math.random() * 256);
  const green = Math.floor(Math.random() * 256);
  const blue = Math.floor(Math.random() * 256);
  const redHex = red.toString(16).padStart(2, '0');
  const greenHex = green.toString(16).padStart(2, '0');
  const blueHex = blue.toString(16).padStart(2, '0');
  return `#${redHex}${greenHex}${blueHex}`;
  }
  
function SettingsModal({ isOpen, onClose, onSave, settings }: { isOpen: boolean, onClose: () => void, onSave: (updatedSettings: Settings) => void, settings: Settings }) {
  const { data: user } = useUser();
  const firestore = useFirestore();

  const [currSettings, setCurrSettings] = useState<Settings>(settings);
  const [activityCategories, setActivityCategories] = useState<Settings['activityCategories']>(currSettings.activityCategories);
  const [colorPickerOpen, setColorPickerOpen] = useState<number | null>(null);

const handleSaveSettings = async () => {
  if (user) {
    // Save settings to Firebase for logged-in users
    const userRef = doc(firestore, `users/${user.uid}`);
    await setDoc(userRef, { settings: currSettings }, { merge: true });
    toast({ title: "settings saved!" });
  } else {
    // Save settings to localStorage for logged-out users
    localStorage.setItem('settings', JSON.stringify(currSettings));
    toast({ title: "settings saved locally!" });
  }
  onSave(currSettings);
};
  

  const handleChange = (field: keyof Settings, value: any) => {
  setCurrSettings({ ...currSettings, [field]: value });
  };

  const handleCategoryChange = (index: number, field: keyof Settings['activityCategories'][number], value: string) => {
  const updatedCategories = [...currSettings.activityCategories];
  updatedCategories[index][field] = value;
  setCurrSettings({ ...currSettings, activityCategories: updatedCategories });
  };

  const handleAddCategory = () => {
  setCurrSettings({
    ...currSettings,
    activityCategories: [
    ...currSettings.activityCategories,
    { name: '', color: generateRandomHexColor() }
    ]
  });
  };

  const handleDeleteCategory = (index: number) => {
  const updatedCategories = [...currSettings.activityCategories];
  updatedCategories.splice(index, 1);
  setCurrSettings({ ...currSettings, activityCategories: updatedCategories });
  };

  const mergeTaskCategoriesWithSettings = () => {
  const mergedCategories = [...currSettings.activityCategories];

  activityCategories.forEach(activityCategory => {
    if (!mergedCategories.some(category => category.name === activityCategory.name)) {
    mergedCategories.push(activityCategory);
    }
  });

  setCurrSettings(prevSettings => ({
    ...prevSettings,
    activityCategories: mergedCategories
  }));
  };

  useEffect(() => {
  if (activityCategories.length > 0) {
    mergeTaskCategoriesWithSettings();
  }
  }, [activityCategories]);

  return (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="p-4 sm:p-6 max-w-full max-h-full md:max-w-3xl lg:max-w-5xl overflow-auto">
      <DialogHeader>
        <DialogTitle>settings</DialogTitle>
      </DialogHeader>   
      <Card className="w-full max-w-3xl mx-auto">
        <CardContent>
          <div className="flex flex-col space-y-6">
            <div>
            <Label htmlFor="defaultTimeLength">default timer length (minutes)</Label>
            <Input
                id="defaultTimeLength"
                type="number"
                value={currSettings.defaultTimeLength}
                onChange={(e) => handleChange('defaultTimeLength', e.target.value)}
            />
            </div>

            <div>
            <Label htmlFor="shortBreak">short break (minutes)</Label>
            <Input
                id="shortBreak"
                type="number"
                value={currSettings.shortBreak}
                onChange={(e) => handleChange('shortBreak', e.target.value)}
            />
            </div>

            <div>
            <Label htmlFor="longBreak">long break (minutes)</Label>
            <Input
                id="longBreak"
                type="number"
                value={currSettings.longBreak}
                onChange={(e) => handleChange('longBreak', e.target.value)}
            />
            </div>

            <div>
            <Label>activity categories</Label>
            {currSettings.activityCategories.map((category, index) => (
            <div key={index} className="flex items-center space-x-4 space-y-2">
            <Input
                type="text"
                value={category.name}
                onChange={(e) =>
                handleCategoryChange(index, 'name', e.target.value)
                }
            />
            <Popover>
                <PopoverTrigger asChild>
                <Button
                style={{ backgroundColor: category.color }}
                onClick={() => setColorPickerOpen(index === colorPickerOpen ? null : index)}
                >
                {category.color}
                </Button>
                </PopoverTrigger>
                {colorPickerOpen === index && (
                <PopoverContent>
                <HexColorPicker
                color={category.color}
                onChange={(newColor) => handleCategoryChange(index, 'color', newColor)}
                />
                </PopoverContent>
                )}
            </Popover>
            <Button variant="destructive" onClick={() => handleDeleteCategory(index)}>
                delete
            </Button>
            </div>
            ))}
            </div>

            <Button onClick={handleAddCategory}>
            add new category
            </Button>

            <Button onClick={handleSaveSettings}>
            save
            </Button>
          </div>
        </CardContent>
      </Card>
      <DialogFooter className="flex justify-end space-x-4 pt-4">
        <Button onClick={onClose}>
            close
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  );
}

export { SettingsModal };