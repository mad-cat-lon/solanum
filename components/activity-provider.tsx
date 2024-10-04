import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useFirestore, useUser } from 'reactfire';
import { collection, getDocs, doc, getDoc, query, Firestore } from 'firebase/firestore';
import { Activity, Settings, defaultSettings } from '@/types/common';
interface ActivityContextProps {
  activities: Activity[];
  tasks: Activity[];
  settings: Settings;
  loading: boolean;
  categoryColors: Record<string, string>;
}

interface ActivityProviderProps {
    children: ReactNode;  
    activities?: Activity[];
    settings?: Settings;
}

const ActivityContext = createContext<ActivityContextProps | undefined>(undefined);

export const useActivityData = (): ActivityContextProps => {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivityData must be used within an ActivityProvider');
  }
  return context;
};

export const ActivityProvider: React.FC<ActivityProviderProps> = ({ children, activities: passedActivities, settings: passedSettings}) => {
  // const [isModalOpen, setIsModalOpen] = useState(false) // state for login prompt modal
  const firestore = useFirestore();
  const {status, data: user } = useUser()
  const [activities, setActivities] = useState<Activity[]>(passedActivities || []);
  const [settings, setSettings] = useState<Settings>(passedSettings || defaultSettings);
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>({}); // Store category colors
  const [tasks, setTasks] = useState<Activity[]>([]); // tasks are activities without short / long breaks
  const [loading, setLoading] = useState(!passedActivities); 
  // Fetch activities from Firebase if not provided as props
  useEffect(() => {
    const fetchActivities = async () => {
      if (!passedActivities && user && firestore) {
        const q = query(collection(firestore as Firestore, `users/${user.uid}/activity`));
        const querySnapshot = await getDocs(q);
        const activityData = querySnapshot.docs.map((doc) => doc.data() as Activity);
        setActivities(activityData);

        // Fetch user settings for category colors
        const userRef = doc(firestore, `users/${user.uid}`);
        const settingsDoc = await getDoc(userRef);
        if (settingsDoc.exists()) {
          const settingsData = settingsDoc.data().settings;
          const colors = settingsData?.activityCategories?.reduce(
            (acc: Record<string, string>, category: { name: string; color: string }) => {
              acc[category.name] = category.color;
              return acc;
            },
            {}
          );
          setCategoryColors(colors || {});
        }
        setLoading(false);
      } 
    };
    const fetchSettings = async () => {
      if (!passedSettings) {
        if (!user) {
          // Check if there are any local settings in localStorage
          const localSettings = localStorage.getItem('settings');

          if (localSettings) {
            setSettings(JSON.parse(localSettings) as Settings);
          } else {
            setSettings(defaultSettings)
          }
        } else {
          const userRef = doc(firestore, `users/${user.uid}`);
          // Fetch settings from Firebase for logged-in users
          const settingsDoc = await getDoc(userRef);
          if (settingsDoc.exists()) {
            const userSettings = settingsDoc.data().settings as Settings || {};
            setSettings(userSettings)
          } else {
            setSettings(defaultSettings)
          }
        }

      }
    }
    if (!passedActivities || !passedSettings) {
      fetchActivities();
      fetchSettings();
    } else {
      // If activities are passed as props, set up the tasks and category colors
      const setupData = () => {
        const colors = passedSettings?.activityCategories.reduce(
          (acc: Record<string, string>, category: { name: string; color: string }) => {
            acc[category.name] = category.color;
            return acc;
          },
          {}
        );
        setCategoryColors(colors || {});

        // Filter breaks from activities (only non-break activities are tasks)
        setTasks(passedActivities?.filter(activity => activity.type !== 'Long Break' && activity.type !== 'Short Break') || []);
        setLoading(false);
      };
      setupData();
    }
  }, [firestore, user, passedActivities, passedSettings]);

  return (
    <ActivityContext.Provider value={{ activities: activities, tasks, settings: settings, loading, categoryColors }}>
      {children}
      {/* <SignupModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} /> */}
    </ActivityContext.Provider>
  );
};