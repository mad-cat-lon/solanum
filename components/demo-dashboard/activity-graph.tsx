'use client';

import { useEffect, useState } from 'react';
import { collection, query, getDocs, Firestore, Timestamp } from 'firebase/firestore';
import { useFirestore, useUser } from 'reactfire';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns'; // Optional: For formatting dates

// Define the shape of an activity document
interface Activity {
  type: string;
  timestamp: Timestamp; // Firestore timestamp
}

// Define the shape of the chart data
interface ChartData {
  date: string;
  [key: string]: number | string; // Dynamic keys for task types
}

export const ActivityGraph: React.FC = () => {
  const firestore = useFirestore();
  const { data: user } = useUser();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [taskTypes, setTaskTypes] = useState<string[]>([]); // To store unique task types dynamically
  const [maxValue, setMaxValue] = useState<number>(0); // To store max value

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
        const taskData: Record<string, Record<string, number | string>> = {}; // Store task counts by date and type
        const taskTypesSet = new Set<string>();
        let globalMaxValue = 0; // Track global max value
  
        // Step 1: Get the min and max dates in the activity list
        let minDate: Date | null = null;
        let maxDate: Date | null = null;
  
        activities.forEach(activity => {
          const { timestamp, type } = activity;
          const date = timestamp.toDate();
  
          if (!minDate || date < minDate) minDate = date;
          if (!maxDate || date > maxDate) maxDate = date;
  
          taskTypesSet.add(type); // Collect task types
        });
  
        // Step 2: Ensure minDate and maxDate are not null before proceeding
        if (!minDate || !maxDate) {
          // No valid activities, return early
          return [];
        }
  
        // Step 3: Generate all dates between minDate and maxDate
        const dateRange: string[] = [];
        let currentDate = new Date(minDate); // Ensure currentDate is a Date object
  
        // Type assertion to make sure TypeScript knows that maxDate is a Date
        const maxDateChecked = maxDate as Date;
  
        // Use a loop to check the date values
        while (currentDate <= maxDateChecked) {
          const formattedDate = format(currentDate, 'yyyy-MM-dd');
          dateRange.push(formattedDate);
          currentDate.setDate(currentDate.getDate() + 1); // Move to the next date
        }
  
        // Step 4: Process the activities into a chartable structure
        activities.forEach(activity => {
          const { timestamp, type } = activity;
          const date = timestamp.toDate();
          const formattedDate = format(date, 'yyyy-MM-dd'); // Format date
  
          if (!taskData[formattedDate]) {
            taskData[formattedDate] = { date: formattedDate };
          }
  
          // Increment the task count
          taskData[formattedDate][type] = (taskData[formattedDate][type] || 0) as number + 1;
          globalMaxValue = Math.max(globalMaxValue, taskData[formattedDate][type] as number);
        });
  
        // Step 5: Ensure every date has an entry for all task types, autofill missing tasks with zero
        const completeData: ChartData[] = dateRange.map(date => {
          const dayData: ChartData = { date }; // Initialize each day's data
  
          // For each task type, ensure it exists for the current date, defaulting to zero
          taskTypesSet.forEach(type => {
            dayData[type] = (taskData[date]?.[type] || 0) as number; // Use '0' for missing types
          });
  
          return dayData;
        });
  
        // Set unique task types to state to create lines dynamically
        setTaskTypes(Array.from(taskTypesSet));
  
        // Set the max value to state
        setMaxValue(globalMaxValue);
  
        return completeData;
      };
  
      setChartData(processActivityData(activities));
    }
  }, [activities]);
  

    const generateRedHexString = () => {
    // Generate red component between 128 and 255
    const red = Math.floor(Math.random() * (255 - 128 + 1)) + 128;
    
    // Generate green and blue components between 0 and 64 for a shade of red
    const green = Math.floor(Math.random() * 65);
    const blue = Math.floor(Math.random() * 65);
    
    // Convert to hexadecimal and pad with zeroes if needed
    const redHex = red.toString(16).padStart(2, '0');
    const greenHex = green.toString(16).padStart(2, '0');
    const blueHex = blue.toString(16).padStart(2, '0');
    
    // Concatenate into a full hex color string
    return `#${redHex}${greenHex}${blueHex}`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Line Chart - Task Activity by Category</CardTitle>
        <CardDescription>
          Activity counts per date, categorized by task type
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              {/* Customize the Y-axis to make the highest point 2/3 of the way up */}
              <YAxis
                domain={[0, maxValue * 1.5]} // Extend the domain so the maxValue is only 2/3 of the Y-axis
              />
              <Tooltip />
              <Legend />
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
                </linearGradient>
              </defs>

              {/* Dynamically create a line for each task category */}
              {taskTypes.map((taskType, index) => (
                <Line
                  key={taskType}
                  type="monotone"
                  dataKey={taskType}
                  stroke={`${generateRedHexString()}`} // Generate random color for each task type
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p>No activity data available.</p>
        )}
      </CardContent>
    </Card>
  );
};
