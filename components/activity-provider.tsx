import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useFirestore, useUser } from 'reactfire';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  Firestore,
  where,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { Activity, Settings, defaultSettings } from '@/types/common';

interface ActivityContextProps {
  activities: Activity[];
  settings: Settings;
  loading: boolean;
  categoryColors: Record<string, string>;
  fetchMoreActivities: (start?: Date, end?: Date) => Promise<void>;  // Pagination support
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

export const ActivityProvider: React.FC<ActivityProviderProps> = ({ children, activities: passedActivities, settings: passedSettings }) => {
  const firestore = useFirestore();
  const { data: user } = useUser();
  const [activities, setActivities] = useState<Activity[]>(passedActivities || []);
  const [settings, setSettings] = useState<Settings>(passedSettings || defaultSettings);
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(!passedActivities);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [allFetched, setAllFetched] = useState(false);

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

  const fetchActivities = async (pageSize: number, lastVisibleDoc: QueryDocumentSnapshot | null, start?: Date, end?: Date) => {
    const logRef = collection(firestore as Firestore, `users/${user?.uid}/log`);
    
    // Set up the query
    let q = query(logRef, orderBy('date', 'desc'), limit(pageSize));
    if (start && end) {
      q = query(logRef, where('date', '>=', start), where('date', '<=', end), orderBy('date', 'desc'), limit(pageSize));
    }
    if (lastVisibleDoc) {
      q = query(q, startAfter(lastVisibleDoc));
    }
  
    const querySnapshot = await getDocs(q);
    const flattenedActivities = querySnapshot.docs.reduce((allActivities: Activity[], doc) => {
      const data = doc.data();
      const date = data.date;
      const activities = data.activities.map((activity: Activity) => ({
        ...activity,
        date: date,  // Attach the outer document's date to each activity
      }));
      return [...allActivities, ...activities];
    }, []);
  
    return {
      activities: flattenedActivities,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
    };
  };

  const fetchInitialActivities = async (start?: Date, end?: Date) => {
    if (user && firestore) {
      setLoading(true);
      const { activities: newActivities, lastDoc: newLastDoc } = await fetchActivities(10, null, start, end);
      
      setActivities(newActivities);
      setLastDoc(newLastDoc);
      setAllFetched(newActivities.length < 10);  // if less than page size, assume all fetched
      setLoading(false);
    }
  };

  const fetchMoreActivities = async (start?: Date, end?: Date) => {
    console.log(`Fetching activities from ${start}-${end}`)
    if (!allFetched && lastDoc && user && firestore) {
      const { activities: newActivities, lastDoc: newLastDoc } = await fetchActivities(10, lastDoc, start, end);
      console.log(activities)
      if (newActivities.length > 0) {
        setActivities((prevActivities) => [...prevActivities, ...newActivities]);
        setLastDoc(newLastDoc);
      } else {
        setAllFetched(true);
      }
    }
  }

  useEffect(() => {
    if (!passedActivities || !passedSettings) {
      if (!passedActivities) {
        fetchInitialActivities();
      }
      if (!passedSettings) {
        fetchSettings();
      }
    } 
    else {
      setLoading(false);
    }
  }, [firestore, user, passedActivities, passedSettings]);

  useEffect(() => {
    const setupData = () => {
      // Set up colors from settings
      const colors = settings?.activityCategories.reduce(
        (acc: Record<string, string>, category: { name: string; color: string }) => {
          acc[category.name] = category.color;
          return acc;
        },
        {}
      );
      setCategoryColors(colors || {});
    }
    setupData();
  }, [settings, activities]);

  return (
    <ActivityContext.Provider value={{ activities, settings, loading, categoryColors, fetchMoreActivities }}>
      {children}
    </ActivityContext.Provider>
  );
};
