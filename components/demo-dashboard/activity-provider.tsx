import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { collection, getDocs, query, Firestore, Timestamp} from 'firebase/firestore';
import { useFirestore, useUser } from 'reactfire';

interface Activity {
  type: string;
  timestamp: Timestamp;
}

interface ActivityContextProps {
  activities: Activity[];
  loading: boolean;
}

interface ActivityProviderProps {
    children: ReactNode;  // ReactNode allows for any valid React child element (JSX)
}

const ActivityContext = createContext<ActivityContextProps | undefined>(undefined);

export const useActivityData = (): ActivityContextProps => {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivityData must be used within an ActivityProvider');
  }
  return context;
};

export const ActivityProvider: React.FC<ActivityProviderProps> = ({ children }) => {
  const firestore = useFirestore();
  const { data: user } = useUser();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      if (user && firestore) {
        const q = query(collection(firestore as Firestore, `users/${user.uid}/activity`));
        const querySnapshot = await getDocs(q);
        const activityData = querySnapshot.docs.map((doc) => doc.data() as Activity);
        setActivities(activityData);
        setLoading(false);
      }
    };

    fetchActivities();
  }, [firestore, user]);

  return (
    <ActivityContext.Provider value={{ activities, loading }}>
      {children}
    </ActivityContext.Provider>
  );
};