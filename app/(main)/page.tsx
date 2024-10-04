'use client'

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

import { Activity, Settings, defaultCategories, defaultSettings } from "@/types/common";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "@/components/ui/command"
import { ResetIcon, ActivityLogIcon, GearIcon } from '@radix-ui/react-icons'
import { collection, addDoc, query, getDocs, getDoc, setDoc, doc, Timestamp} from 'firebase/firestore';
import { useFirestore, useUser } from 'reactfire';
import { StatsModal } from '@/components/stats-modal';
import { SettingsModal } from '@/components/settings-modal';


export default function Component() {
  const firestore = useFirestore()
  const { data: user } = useUser()
  const [time, setTime] = useState(25 * 60)
  const [isActive, setIsActive] = useState(false)
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentActivity, setCurrentActivity] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [filteredCategories, setFilteredCategories] = useState<string[]>([])
  const [isCommandOpen, setIsCommandOpen] = useState(false)
  const [suggestion, setSuggestion] = useState('')
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const hasAlerted = useRef(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [settings, setSettings] = useState<Settings>(defaultSettings) // Track user settings
  const [loading, setLoading] = useState(true)


  const [modals, setModals] = useState({ settings: false, stats: false });
  const toggleModal = (modalName: 'settings' | 'stats') => {
    setModals(prev => ({ ...prev, [modalName]: !prev[modalName] }));
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isActive) {
        e.preventDefault();
        e.returnValue = ''; 
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isActive]);

  // Callback handler for updating settings
  const handleSettingsUpdate = (updatedSettings: Settings) => {
    setSettings(updatedSettings);
    const updatedCategories = updatedSettings.activityCategories.map(category => category.name);
    setCategories(updatedCategories);
    setFilteredCategories(updatedCategories); 
  };

  useEffect(() => {
    const getOrSetLocalSettings = (newLocalSettings: Settings | null) => {
      if (newLocalSettings === null) {
        const localSettings = localStorage.getItem('settings');
        // console.log('Checking for local settings doc')
        if (localSettings) {
          // console.log('Retrieving from local settings')
          const parsedSettings = JSON.parse(localSettings) as Partial<Settings>;
          // Merge local settings with default settings
          const mergedSettings: Settings = {
            ...defaultSettings, // Start with defaults
            ...parsedSettings, // Override with local storage settings
            activityCategories: parsedSettings.activityCategories 
              ? parsedSettings.activityCategories 
              : defaultSettings.activityCategories
          };
          setSettings(mergedSettings);
          setCategories(mergedSettings.activityCategories.map(category => category.name));
          setFilteredCategories(mergedSettings.activityCategories.map(category => category.name));
          setTime(mergedSettings.defaultTimeLength * 60);

        } else {
          // console.log('Falling back to default local settings')
          setSettings(defaultSettings);
          // Fallback to default settings if no localSettings are found
          setTime(25 * 60);
          setCategories(defaultCategories.map(category => category.name));
          setFilteredCategories(defaultCategories.map(category => category.name));
        }
      } else {
        localStorage.setItem('settings', JSON.stringify(newLocalSettings));
      }
    }
    const fetchUserData = async () => {
      if (user) {
        // Fetch settings from Firebase for logged-in users
        const userRef = doc(firestore, `users/${user.uid}`);
        const settingsDoc = await getDoc(userRef);
  
        if (settingsDoc.exists()) {
          // console.log('Settings doc exists');
          const fetchedSettings = settingsDoc.data().settings as Settings || {};
          setSettings(fetchedSettings);
          // Save it in local
          getOrSetLocalSettings(fetchedSettings);
          setCategories(fetchedSettings.activityCategories.map(category => category.name));
          setFilteredCategories(fetchedSettings.activityCategories.map(category => category.name));
          setTime(fetchedSettings.defaultTimeLength * 60);
        } else {
          // console.log('No settings, falling back to default')
          getOrSetLocalSettings(null);
          // If no settings document exists, fallback to default settings
          setCategories(defaultSettings.activityCategories.map(category => category.name));
          setFilteredCategories(defaultSettings.activityCategories.map(category => category.name));
          setTime(defaultSettings.defaultTimeLength * 60);
        }

        // Fetch user activities from Firestore
        const activitiesRef = collection(firestore, `users/${user.uid}/activity`);
        const activitiesSnapshot = await getDocs(activitiesRef);
        const fetchedActivities = activitiesSnapshot.docs.map(doc => doc.data() as Activity);
        setActivities(fetchedActivities);

      } else {
        getOrSetLocalSettings(null);
      }
      setLoading(false); 
    };
  
    fetchUserData();
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
        timerRef.current = null
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
    setCurrentActivity('')
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
    if (currentActivity !== '' && !filteredCategories.includes(currentActivity)) {
      if (user) {
        // Add new category to the settings in Firebase for logged-in users
        const existingSettings = settings || {
          longBreak: 15,
          shortBreak: 10,
          defaultTimeLength: 25,
          activityCategories: []
        };
        const updatedCategories = [...existingSettings.activityCategories, { name: currentActivity, color: '#ff0000' }];
        const updatedSettings = { ...existingSettings, activityCategories: updatedCategories };
  
        setSettings(updatedSettings);
        setFilteredCategories(updatedCategories.map(category => category.name));
  
        // Update Firestore
        const userRef = doc(firestore, `users/${user.uid}`);
        await setDoc(userRef, { settings: updatedSettings }, { merge: true });
        toast({ title: `added new category "${currentActivity}" to your saved list!` });
      } else {
        // Save the new category to localStorage for logged-out users
        const existingSettings = settings || {
          longBreak: 15,
          shortBreak: 10,
          defaultTimeLength: 25,
          activityCategories: []
        };
        const updatedCategories = [...existingSettings.activityCategories, { name: currentActivity, color: '#ff0000' }];
        const updatedSettings = { ...existingSettings, activityCategories: updatedCategories };
  
        setSettings(updatedSettings);
        setCategories(updatedSettings.activityCategories.map(category => category.name))
        setFilteredCategories(updatedSettings.activityCategories.map(category => category.name));
  
        // Save settings to localStorage
        localStorage.setItem('settings', JSON.stringify(updatedSettings));
        toast({ title: `added new category "${currentActivity}" to your local settings!` });
      }
    }
  };

  const handleAddNewActivity = async (activity: string) => {
    const newActivity = {
      timestamp: Timestamp.fromDate(new Date()),
      type: activity
    };
    if (user) {
      // Submit the completed activity to Firestore
      const activityCollectionRef = collection(firestore, `users/${user.uid}/activity`);
      await addDoc(activityCollectionRef, newActivity);
    }
    setActivities(prevActivities => [...prevActivities, newActivity]);
  
  };


  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && suggestion) {
      e.preventDefault();
      setCurrentActivity(suggestion);
      setSuggestion('');
    }
  };

  const handleCategoryInputClick = () => {
    // Focus on the input and allow interaction
    inputRef.current?.focus();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl mx-auto">
          <CardContent>
            <div className="flex flex-col items-center space-y-8 p-4">
              <Skeleton className="w-72 h-24" /> 
              
              <Skeleton className="w-40 h-8" />

              <div className="flex flex-wrap justify-center gap-4">
                <Skeleton className="w-40 h-14" />
                <Skeleton className="w-40 h-14" />
                <Skeleton className="w-40 h-14" />
                <Skeleton className="w-40 h-14" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          {/* <CardTitle className="text-4xl font-bold text-center">Tomato Timer</CardTitle> */}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-8">
            <div className="text-9xl font-bold tabular-nums" style={{ fontSize: 'clamp(4rem, 10vw, 8rem)' }}>{formatTime(time)}</div>
            <div className="text-3xl font-semibold">{currentActivity}</div>
            <div className="flex flex-wrap justify-center gap-4">
              <Button onClick={() => startTimer(settings?.defaultTimeLength || 25, currentActivity)} className="bg-red-600 hover:bg-red-700 text-white text-xl py-6 px-8">
                lock in!
              </Button>
              <Button onClick={() => startTimer(settings?.shortBreak || 10, 'Short Break')} variant="secondary" className="text-xl py-6 px-8">
                short break
              </Button>
              <Button onClick={() => startTimer(settings?.longBreak || 15, 'Long Break')} variant="secondary" className="text-xl py-6 px-8">
                long break
              </Button>
              <Button onClick={resetTimer} variant="outline" className="text-xl py-6 px-8">
                <ResetIcon className="h-6 w-6 mr-2" />
                reset
              </Button>
            </div>
            <div className="w-full max-w-md flex flex-col items-center">
              <div className="flex items-center space-x-4 w-full">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    id="activity-category"
                    ref={inputRef}
                    value={currentActivity}
                    onClick={handleCategoryInputClick}
                    onChange={(e) => handleTaskCategoryChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsCommandOpen(true)}
                    onBlur={() => setIsCommandOpen(false)}
                    className="py-3 pl-4 pr-20 w-full bg-transparent border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md caret-black transition-all duration-150 ease-in-out"
                    placeholder="enter category"
                    style={{ caretColor: 'black', fontSize: '1rem'}}
                  />
                  {suggestion && suggestion !== currentActivity && (
                    <span
                      className="absolute top-1/2 left-4 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                      style={{
                        paddingLeft: `${currentActivity.length}ch`,
                        fontSize: 'inherit',
                        lineHeight: 'inherit',
                        fontWeight: 'inherit',
                      }}
                    >
                      {suggestion.slice(currentActivity.length)}
                    </span>
                  )}
                  {isCommandOpen && (
                    <Command className="absolute z-20 w-full mt-1 overflow-hidden" style={{ minHeight: '150px' }}>
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
                          <CommandEmpty>no matching categories found</CommandEmpty>
                        )}
                      </CommandList>
                    </Command>
                  )}
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={() => {toggleModal('stats')}} variant="outline">
                        <ActivityLogIcon className="h-6 w-6" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      view stats
                    </TooltipContent>
                  </Tooltip>
                  </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={() => {toggleModal('settings')}} variant="outline">
                        <GearIcon className="h-6 w-6" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      settings
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
          <StatsModal isOpen={modals.stats} onClose={() => {toggleModal('stats')}} activities={activities} settings={settings}/>
          <SettingsModal isOpen={modals.settings} onClose={() => {toggleModal('settings')}} onSave={handleSettingsUpdate} settings={settings}/>
        </CardContent>
      </Card>
    </div>
  )
}