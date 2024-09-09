import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { collection, getDocs, doc, getDoc, query, Firestore, Timestamp} from 'firebase/firestore';
import { useFirestore, useUser } from 'reactfire';
import { SignupModal } from '@/components/signup-modal';
interface Activity {
  type: string;
  timestamp: Timestamp;
}

interface ActivityContextProps {
  activities: Activity[];
  loading: boolean;
  categoryColors: Record<string, string>; // Map of category to color
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
  const { status, data: user } = useUser();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false) // Modal state
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>({}); // Store category colors

  useEffect(() => {
    const fetchActivities = async () => {
      if (user && firestore) {
        const q = query(collection(firestore as Firestore, `users/${user.uid}/activity`));
        const querySnapshot = await getDocs(q);
        const activityData = querySnapshot.docs.map((doc) => doc.data() as Activity);
        setActivities(activityData);
        setLoading(false);
        setIsModalOpen(false);
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
      } else if (status !== 'loading' && !user) {
        // User isn't logged in, so show the modal
        setIsModalOpen(true);
      }
    };

    fetchActivities();
  }, [firestore, user]);

  return (
    <ActivityContext.Provider value={{ activities, loading, categoryColors }}>
      {children}
      <SignupModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </ActivityContext.Provider>
  );
};