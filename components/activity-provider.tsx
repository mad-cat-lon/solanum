import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useFirestore, useUser } from 'reactfire';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
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
  const [minStartDate, setMinStartDate] = useState<Date | null>(null);
  const [maxEndDate, setMaxEndDate] = useState<Date | null>(null)

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

  const fetchActivities = async (start?: Date, end?: Date) => {
    const logRef = collection(firestore as Firestore, `users/${user?.uid}/log`);
    
    // Set up the query
    // let q = query(logRef, orderBy('date', 'desc'));
    // if (start && end) {
    //   q = query(logRef, where('date', '>=', start), where('date', '<=', end), orderBy('date', 'desc'));
    // }
    // Adjust the query based on the boundaries of minStartDate and maxEndDate
    let q = query(logRef, orderBy('date', 'desc'));

    if (start && end) {
      console.log()
      q = query(logRef, where('date', '>=', start), where('date', '<=', end), orderBy('date', 'desc'));
    } else if (start && maxEndDate && start > maxEndDate) {
      // Fetch only data after maxEndDate if the start is beyond maxEndDate
      console.log('Fetching data past maxEndDate')
      q = query(logRef, where('date', '>', maxEndDate), where('date', '<=', end || start), orderBy('date', 'desc'));
    } else if (end && minStartDate && end < minStartDate) {
      // Fetch only data before minStartDate if the end is before minStartDate
      console.log('Fetching data before minStartDate')
      q = query(logRef, where('date', '>=', start || end), where('date', '<', minStartDate), orderBy('date', 'desc'));
    }
    
  
    const querySnapshot = await getDocs(q);
    const flattenedActivities = querySnapshot.docs.reduce((allActivities: Activity[], doc) => {
      const data = doc.data();
      const date = data.date;
      const activities = data.activities.map((activity: Activity) => ({
        ...activity,
        date: date, 
      }));
      return [...allActivities, ...activities];
    }, []);
  
    return {
      activities: flattenedActivities,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
    };
  };

  const fetchInitialActivities = async (start?: Date, end?: Date) => {
    console.log(`fetchInitialActivities: Fetching activities from ${start}-${end}`)
    if (user && firestore) {
      setLoading(true);
      const { activities: newActivities,} = await fetchActivities(start, end);
      
      setActivities(newActivities);
      setLoading(false);
    }
  };


  const fetchMoreActivities = async (start?: Date, end?: Date) => {
    console.log(`fetchMoreActivities: Fetching activities from ${start}-${end}`);
    if (user && firestore) {
      // Decide whether to fetch based on minStartDate and maxEndDate
      if (start && maxEndDate && start > maxEndDate) {
        // Fetch data only after the current maxEndDate
        const { activities: newActivities } = await fetchActivities(maxEndDate, end);
  
        if (newActivities.length > 0) {
          setActivities((prevActivities) => {
            const existingActivityKeys = new Set(
              prevActivities.map((activity) => `${activity.timestamp}-${activity.type}`)
            );
            
            const uniqueNewActivities = newActivities.filter((activity) => {
              const activityKey = `${activity.timestamp}-${activity.type}`;
              return !existingActivityKeys.has(activityKey);
            });
            
            return [...prevActivities, ...uniqueNewActivities];
          });
  
          setMaxEndDate((prev) => (end && (!prev || end > prev) ? end : prev));
        }
      } else if (end && minStartDate && end < minStartDate) {
        // Fetch data only before the current minStartDate
        const { activities: newActivities } = await fetchActivities(start, minStartDate);
  
        if (newActivities.length > 0) {
          setActivities((prevActivities) => {
            const existingActivityKeys = new Set(
              prevActivities.map((activity) => `${activity.timestamp}-${activity.type}`)
            );
            
            const uniqueNewActivities = newActivities.filter((activity) => {
              const activityKey = `${activity.timestamp}-${activity.type}`;
              return !existingActivityKeys.has(activityKey);
            });
            
            return [...uniqueNewActivities, ...prevActivities];
          });
  
          setMinStartDate((prev) => (start && (!prev || start < prev) ? start : prev));
        }
      } else {
        // If date range falls within the already fetched range, skip fetching
        console.log("Skipping fetch: data within cached range");
      }
    }
  }
  // const fetchMoreActivities = async (start?: Date, end?: Date) => {
  //   console.log(`Fetching activities from ${start}-${end}`)
  //   if (user && firestore) {
      
  //     const { activities: newActivities } = await fetchActivities(start, end);
  //     console.log(activities)
  //     if (newActivities.length > 0) {
  //       setActivities((prevActivities) => {
  //         // Create a set of unique identifiers for existing activities
  //         const existingActivityKeys = new Set(
  //           prevActivities.map(activity => `${activity.timestamp}-${activity.type}`)
  //         );
  
  //         // Filter out activities that already exist in `prevActivities`
  //         const uniqueNewActivities = newActivities.filter(activity => {
  //           const activityKey = `${activity.timestamp}-${activity.type}`;
  //           return !existingActivityKeys.has(activityKey);
  //         });
  
  //         return [...prevActivities, ...uniqueNewActivities];
  //       });
  //     }
  //   }
  // }

  useEffect(() => {
    if (!passedActivities && activities.length === 0) {
        let today: Date = new Date();
        let date7DaysAgo: Date = new Date();
        date7DaysAgo.setDate(today.getDate() - 7);
        fetchInitialActivities(date7DaysAgo, today);
    }
    if (!passedSettings) {
        fetchSettings();
    } else {
        setLoading(false);
    }
}, [firestore, user, passedActivities, passedSettings, activities.length]);

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
