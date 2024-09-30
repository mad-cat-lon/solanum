'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "@/components/ui/command"
import { ResetIcon } from '@radix-ui/react-icons'
import { collection, addDoc, query, getDocs, getDoc, setDoc, doc } from 'firebase/firestore';
import { useFirestore, useUser } from 'reactfire';

import { SignupModal } from '@/components/signup-modal'

interface Settings {
  longBreak: number;
  shortBreak: number;
  defaultTimeLength: number;
  activityCategories: {
    name: string;
    color: string;
  }[];
}

export default function Component() {
  const [time, setTime] = useState(25 * 60)
  const [isActive, setIsActive] = useState(false)
  const [currentActivity, setCurrentActivity] = useState('Work')
  const [categories, setCategories] = useState<string[]>([])
  const [filteredCategories, setFilteredCategories] = useState<string[]>([])
  const [isCommandOpen, setIsCommandOpen] = useState(false)
  const [suggestion, setSuggestion] = useState('')
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const hasAlerted = useRef(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isModalOpen, setIsModalOpen] = useState(false) // Modal state
  const [settings, setSettings] = useState<Settings | null>(null) // Track user settings

  const firestore = useFirestore()
  const { data: user } = useUser()

  useEffect(() => {
    if (user) {
      const fetchSettings = async () => {
        const userRef = doc(firestore, `users/${user.uid}`);
        const settingsDoc = await getDoc(userRef);

        if (settingsDoc.exists()) {
          const fetchedSettings = settingsDoc.data().settings as Settings || {};
          const defaultSettings: Settings = {
            longBreak: fetchedSettings.longBreak ?? 15,
            shortBreak: fetchedSettings.shortBreak ?? 10,
            defaultTimeLength: fetchedSettings.defaultTimeLength ?? 25,
            activityCategories: fetchedSettings.activityCategories ?? [{ name: 'Work', color: '#000000' }]
          };
          setSettings(defaultSettings);
          setCategories(defaultSettings.activityCategories.map(category => category.name));
          setFilteredCategories(defaultSettings.activityCategories.map(category => category.name));
          setTime(defaultSettings.defaultTimeLength * 60);
        } else {
          setSettings({
            longBreak: 15,
            shortBreak: 5,
            defaultTimeLength: 25,
            activityCategories: [{ name: 'Work', color: '#000000' }]
          });
          setTime(25 * 60);
        }
      };

      fetchSettings();
    }
  }, [firestore, user]);

  useEffect(() => {
    audioRef.current = new Audio("/ping.mp3")
  }, [])

  useEffect(() => {
    if (isActive && time > 0) {
      timerRef.current = setInterval(() => {
        setTime((prevTime) => prevTime - 1)
      }, 1000)
      document.title = `${formatTime(time)} remaining - ${currentActivity}`
    } else if (time === 0 && !hasAlerted.current) {
      setIsActive(false)
      if (audioRef.current) {
        audioRef.current.play()
      }
      alert(`${currentActivity} session completed!`)
      hasAlerted.current = true
      handleAddNewActivity(currentActivity)
      document.title = `Lock in!`
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isActive, time, currentActivity])


  const startTimer = (duration: number, activity: string) => {
    setTime(duration * 60)
    setCurrentActivity(activity)
    handleAddNewCategory()
    setIsActive(true)
    hasAlerted.current = false
  }

  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    setIsActive(false)
    setTime((settings?.defaultTimeLength?? 25) * 60) 
    setCurrentActivity('Work')
    document.title = `Lock in!`
    hasAlerted.current = false
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleTaskCategoryChange = (newCategory: string) => {
    setCurrentActivity(newCategory);
    if (newCategory === '') {
      setFilteredCategories(categories);
      setSuggestion('');
    } else {
      const filtered = categories.filter((category) =>
        category.toLowerCase().startsWith(newCategory.toLowerCase())
      );
      setFilteredCategories(filtered);
      setSuggestion(filtered.length > 0 ? filtered[0] : '');
    }
    setIsCommandOpen(true);
  };

  const handleCategorySelect = (category: string) => {
    setCurrentActivity(category);
    setIsCommandOpen(false);
    setSuggestion('');
  };

  const handleAddNewCategory = async () => {
    if (user && currentActivity !== 'Work' && !filteredCategories.includes(currentActivity)) {
      // Add new category to the settings
      const existingSettings = settings || {
        longBreak: 15,
        shortBreak: 10,
        defaultTimeLength: 25,
        activityCategories: []
      }
      const updatedCategories = [...existingSettings.activityCategories, { name: currentActivity, color: '#ff0000' }];
      const updatedSettings = { ...existingSettings, activityCategories: updatedCategories };
      
      setSettings(updatedSettings);
      setFilteredCategories(updatedCategories.map(category => category.name));

      // Update Firestore
      const userRef = doc(firestore, `users/${user.uid}`);
      await setDoc(userRef, { settings: updatedSettings }, { merge: true });
      toast({ title: `added new category "${currentActivity}" to your saved list!`})

    }
  };

  const handleAddNewActivity = async (timerType: string) => {
    if (user) {
      // Submit the completed activity to Firestore
      const activityCollectionRef = collection(firestore, `users/${user.uid}/activity`);
      const newActivity = {
        timestamp: new Date(),
        type: timerType
      };
      await addDoc(activityCollectionRef, newActivity);
    }
  };


  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && suggestion) {
      e.preventDefault();
      setCurrentActivity(suggestion);
      setSuggestion('');
    }
  };

  const handleCategoryInputClick = () => {
    if (!user) {
      // User is not logged in, show modal
      setIsModalOpen(true);
    } else {
      // Focus on the input and allow interaction
      inputRef.current?.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          {/* <CardTitle className="text-4xl font-bold text-center">Tomato Timer</CardTitle> */}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-8">
            <div className="text-9xl font-bold tabular-nums">{formatTime(time)}</div>
            <div className="text-3xl font-semibold">{currentActivity}</div>
            <div className="flex flex-wrap justify-center gap-4">
              <Button onClick={() => startTimer(settings?.defaultTimeLength || 25, currentActivity)} className="bg-red-600 hover:bg-red-700 text-white text-xl py-6 px-8">
                lock in!
              </Button>
              <Button onClick={() => startTimer(settings?.shortBreak || 10, 'Short Break')} className="text-xl py-6 px-8">
                short break
              </Button>
              <Button onClick={() => startTimer(settings?.longBreak || 15, 'Long Break')} className="text-xl py-6 px-8">
                long break
              </Button>
              <Button onClick={resetTimer} variant="outline" className="text-xl py-6 px-8">
                <ResetIcon className="h-6 w-6 mr-2" />
                reset
              </Button>
            </div>
            <div className="w-full max-w-md relative">
              <Label htmlFor="activity-category" className="block text-xl font-medium mb-2">
                activity category
              </Label>
              <div className="relative flex items-center">
                <Input
                  type="text"
                  id="activity-category"
                  ref={inputRef}
                  value={currentActivity}
                  onClick={handleCategoryInputClick}
                  onChange={(e) => handleTaskCategoryChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsCommandOpen(true)}
                  onBlur={() => setIsCommandOpen(false)} // Add onBlur to hide the Command
                  className="text-xl py-3 pl-4 pr-20 w-full bg-transparent caret-black" 
                  placeholder="enter activity category"
                  style={{ caretColor: 'black' }} // Ensures the caret remains visible
                />
                {suggestion && suggestion !== currentActivity && (
                  <span 
                    className="absolute top-1/2 left-4 transform -translate-y-1/2 pointer-events-none text-gray-400"
                    style={{ 
                      paddingLeft: `${currentActivity.length}ch`, // Dynamically move the suggestion to the right
                      fontSize: 'inherit', // Match input text size
                      lineHeight: 'inherit', // Match input line height
                      fontWeight: 'inherit', // Match input font weight
                    }} 
                  >
                    {suggestion.slice(currentActivity.length)}
                  </span>
                )}
              </div>
              {isCommandOpen && (
                <Command className="absolute z-10 w-full mt-1">
                  <CommandList>
                    {filteredCategories.length > 0 ? (
                      filteredCategories.map((category, index) => (
                        <CommandItem
                          key={index}
                          onMouseDown={() => handleCategorySelect(category)}
                        >
                          {category}
                        </CommandItem>
                      ))
                    ) : (
                      <CommandEmpty>no existing categories found</CommandEmpty>
                    )}
                  </CommandList>
                </Command>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <SignupModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}