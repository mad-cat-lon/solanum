'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useFirestore, useUser } from 'reactfire'
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore'
import { toast } from "@/components/ui/use-toast"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { HexColorPicker } from "react-colorful" // Install this package

interface Settings {
  longBreak: number;
  shortBreak: number;
  defaultTimeLength: number;
  activityCategories: {
    name: string;
    color: string;
  }[];
}

const generateRandomHexColor = () => {
  const red = Math.floor(Math.random() * 256);
  const green = Math.floor(Math.random() * 256);
  const blue = Math.floor(Math.random() * 256);
  const redHex = red.toString(16).padStart(2, '0');
  const greenHex = green.toString(16).padStart(2, '0');
  const blueHex = blue.toString(16).padStart(2, '0');
  return `#${redHex}${greenHex}${blueHex}`;
}

export default function SettingsPage() {
  const { data: user } = useUser();
  const firestore = useFirestore();

  const defaultSettings: Settings = {
    longBreak: 15,
    shortBreak: 10,
    defaultTimeLength: 25,
    activityCategories: []
  };

  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [taskCategories, setTaskCategories] = useState<Settings['activityCategories']>([]);
  const [colorPickerOpen, setColorPickerOpen] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const userRef = doc(firestore, `users/${user.uid}`);
        const settingsDoc = await getDoc(userRef);

        if (settingsDoc.exists()) {
          const fetchedSettings = settingsDoc.data().settings as Partial<Settings> || {};

          setSettings({
            longBreak: fetchedSettings.longBreak || defaultSettings.longBreak,
            shortBreak: fetchedSettings.shortBreak || defaultSettings.shortBreak,
            defaultTimeLength: fetchedSettings.defaultTimeLength || defaultSettings.defaultTimeLength,
            activityCategories: fetchedSettings.activityCategories || defaultSettings.activityCategories
          });
        }

        const taskCategoriesRef = collection(firestore, `users/${user.uid}/taskCategories`);
        const taskCategoriesSnapshot = await getDocs(taskCategoriesRef);
        const fetchedTaskCategories = taskCategoriesSnapshot.docs.map(doc => ({
          name: doc.data().name,
          color: doc.data().color || generateRandomHexColor() 
        }));
        setTaskCategories(fetchedTaskCategories);
      };

      fetchData();
    }
  }, [firestore, user]);

  const handleSaveSettings = async () => {
    if (user) {
      const userRef = doc(firestore, `users/${user.uid}`);
      await setDoc(userRef, { settings }, { merge: true });
      toast({ title: "settings saved!" })
    }
  };

  const handleChange = (field: keyof Settings, value: any) => {
    setSettings({ ...settings, [field]: value });
  };

  const handleCategoryChange = (index: number, field: keyof Settings['activityCategories'][number], value: string) => {
    const updatedCategories = [...settings.activityCategories];
    updatedCategories[index][field] = value;
    setSettings({ ...settings, activityCategories: updatedCategories });
  };

  const handleAddCategory = () => {
    setSettings({
      ...settings,
      activityCategories: [
        ...settings.activityCategories,
        { name: '', color: generateRandomHexColor() }
      ]
    });
  };

  const handleDeleteCategory = (index: number) => {
    const updatedCategories = [...settings.activityCategories];
    updatedCategories.splice(index, 1);
    setSettings({ ...settings, activityCategories: updatedCategories });
  };

  const mergeTaskCategoriesWithSettings = () => {
    const mergedCategories = [...settings.activityCategories];

    taskCategories.forEach(taskCategory => {
      if (!mergedCategories.some(category => category.name === taskCategory.name)) {
        mergedCategories.push(taskCategory);
      }
    });

    setSettings(prevSettings => ({
      ...prevSettings,
      activityCategories: mergedCategories
    }));
  };

  useEffect(() => {
    if (taskCategories.length > 0) {
      mergeTaskCategoriesWithSettings();
    }
  }, [taskCategories]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-6">
            <div>
              <Label htmlFor="defaultTimeLength">default timer length (minutes)</Label>
              <Input
                id="defaultTimeLength"
                type="number"
                value={settings.defaultTimeLength}
                onChange={(e) => handleChange('defaultTimeLength', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="shortBreak">short break (minutes)</Label>
              <Input
                id="shortBreak"
                type="number"
                value={settings.shortBreak}
                onChange={(e) => handleChange('shortBreak', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="longBreak">long break (minutes)</Label>
              <Input
                id="longBreak"
                type="number"
                value={settings.longBreak}
                onChange={(e) => handleChange('longBreak', e.target.value)}
              />
            </div>

            <div>
              <Label>activity categories</Label>
              {settings.activityCategories.map((category, index) => (
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
    </div>
  );
}
