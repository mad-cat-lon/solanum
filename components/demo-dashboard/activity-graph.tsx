'use client';
import { useEffect, useState } from 'react';
import { collection, query, getDocs, Firestore } from 'firebase/firestore';
import { useFirestore, useUser } from 'reactfire';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

// Define the shape of an activity document
interface Activity {
  type: string;
  timestamp: string;
}

// Define the shape of the chart data
interface ChartData {
  type: string;
  count: number;
}

export const ActivityGraph: React.FC = () => {
  const firestore = useFirestore();
  const { data: user } = useUser();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    if (user) {
      const fetchActivities = async () => {
        const q = query(collection(firestore as Firestore, `users/${user.uid}/activity`));
        const querySnapshot = await getDocs(q);
        const activityData = querySnapshot.docs.map(doc => doc.data() as Activity);
        setActivities(activityData);
      };

      fetchActivities();
    }
  }, [firestore, user]);

  useEffect(() => {
    if (activities.length > 0) {
      const processActivityData = (activities: Activity[]): ChartData[] => {
        const taskCounts = activities.reduce((acc: Record<string, number>, activity) => {
          const { type } = activity;
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});

        return Object.keys(taskCounts).map(type => ({
          type,
          count: taskCounts[type],
        }));
      };

      setChartData(processActivityData(activities));
    }
  }, [activities]);

  return (
    <div className="p-4 bg-white shadow-lg rounded-md">
      <h2 className="text-xl font-bold mb-4">Task Activity</h2>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="type" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p>No activity data available.</p>
      )}
    </div>
  );
};

// export default TaskChart;