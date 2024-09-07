'use client';

import { useEffect, useState } from 'react';
import { collection, query, getDocs, Firestore, Timestamp } from 'firebase/firestore';
import { useFirestore, useUser } from 'reactfire';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { format, startOfWeek, subDays, subMonths, subYears } from 'date-fns';
import { DatePicker } from '@/components/ui/date-picker'; 
import { useActivityData } from '@/components/demo-dashboard/activity-provider';

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
  // const [activities, setActivities] = useState<Activity[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [taskTypes, setTaskTypes] = useState<string[]>([]); // To store unique task types dynamically
  const [maxValue, setMaxValue] = useState<number>(0); // To store max value
  const [colorMap, setColorMap] = useState<Record<string, string>>({}); // Color map for task types


  // State for date filtering
  const [selectedRange, setSelectedRange] = useState<'today' | '7d' | 'week' | '30d' | '120d' | 'year' | 'custom'>('7d');
  const [customDateRange, setCustomDateRange] = useState<{ start: Date | undefined; end: Date | undefined }>({
    start: undefined,
    end: undefined,
  });
  const { activities, loading } = useActivityData();
  
  useEffect(() => {
    if (!loading && activities.length > 0) {
      const { start, end } = getDateRange();
      const filteredActivities = activities.filter(activity => {
        const activityDate = activity.timestamp.toDate();
        if (start && end) {
          return activityDate >= start && activityDate <= end;
        }
        return false;
      });
  
      const processActivityData = (activities: Activity[]): ChartData[] => {
        const taskData: Record<string, Record<string, number | string>> = {}; // Store task counts by date/hour and type
        const taskTypesSet = new Set<string>();
        let globalMaxValue = 0; // Track global max value
  
        // Step 1: Get the min and max dates in the activity list
        let minDate: Date = new Date();
        let maxDate: Date = new Date();

        filteredActivities.forEach(activity => {
          const { timestamp, type } = activity;
          const date = timestamp.toDate();
  
          if (!minDate || date < minDate) minDate = date;
          if (!maxDate || date > maxDate) maxDate = date;
  
          taskTypesSet.add(type);
        });
  
        // Step 2: Ensure minDate and maxDate are not null before proceeding
        if (!minDate || !maxDate) {
          // No valid activities, return early
          return [];
        }
  
        // Step 3: Generate all dates between minDate and maxDate (group by day or hour)
        const dateRange: string[] = [];
        let currentDate = new Date(minDate); // Ensure currentDate is a Date object
  
        const isToday = selectedRange === 'today';
  
        // Use a loop to check the date/hour values
        while (currentDate <= maxDate) {
          const formattedDate = isToday
            ? format(currentDate, 'HH') // Group by hour if it's today
            : format(currentDate, 'yyyy-MM-dd'); // Otherwise group by day
          dateRange.push(formattedDate);
          if (isToday) {
            currentDate.setHours(currentDate.getHours() + 1); // Move to the next hour
          } else {
            currentDate.setDate(currentDate.getDate() + 1); // Move to the next date
          }
        }
  
        // Step 4: Process the activities into a chartable structure
        filteredActivities.forEach(activity => {
          const { timestamp, type } = activity;
          const date = timestamp.toDate();
          const formattedDate = isToday
            ? format(date, 'HH') // Format by hour for today's range
            : format(date, 'yyyy-MM-dd'); // Format by day otherwise
  
          if (!taskData[formattedDate]) {
            taskData[formattedDate] = { date: formattedDate };
          }
  
          // Increment the task count
          taskData[formattedDate][type] = (taskData[formattedDate][type] || 0) as number + 1;
          globalMaxValue = Math.max(globalMaxValue, taskData[formattedDate][type] as number);
        });
  
        // Step 5: Ensure every date/hour has an entry for all task types, autofill missing tasks with zero
        const completeData: ChartData[] = dateRange.map(date => {
          const dayData: ChartData = { date }; // Initialize each day's or hour's data
  
          // For each task type, ensure it exists for the current date/hour, defaulting to zero
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
  
      setChartData(processActivityData(filteredActivities));
    }
  }, [activities, selectedRange, customDateRange]);
  

  const generateRandomHexColor = () => {
    // Generate red, green, and blue components between 0 and 255
    const red = Math.floor(Math.random() * 256);
    const green = Math.floor(Math.random() * 256);
    const blue = Math.floor(Math.random() * 256);
  
    // Convert to hexadecimal and pad with zeroes if needed
    const redHex = red.toString(16).padStart(2, '0');
    const greenHex = green.toString(16).padStart(2, '0');
    const blueHex = blue.toString(16).padStart(2, '0');
  
    // Concatenate into a full hex color string
    return `#${redHex}${greenHex}${blueHex}`;
  };

  // Get or assign a color for a task type
  const getColorForTaskType = (taskType: string) => {
    if (!colorMap[taskType]) {
      setColorMap(prev => ({
        ...prev,
        [taskType]: generateRandomHexColor()
      }));
    }
    return colorMap[taskType];
  };


  // Function to get date range based on selected filter
  const getDateRange = () => {
    const now = new Date();
    switch (selectedRange) {
      case '7d':
        return { start: subDays(now, 7), end: now };
      case 'week':
        return { start: startOfWeek(now), end: now };
      case '30d':
        return { start: subDays(now, 30), end: now };
      case '120d':
        return { start: subDays(now, 120), end: now };
      case 'year':
        return { start: subYears(now, 1), end: now };
      case 'today': {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0); // Start of the day
        const end = new Date(now);
        end.setHours(23, 59, 59, 999); // End of the day
        return { start, end };
      }
      case 'custom':
        return customDateRange;
      default:
        return { start: null, end: null };
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Completed tasks</CardTitle>
        <CardDescription>
          Task counts per date, categorized by task type
        </CardDescription>
      </CardHeader>
      <CardContent>

        <div className="flex space-x-4 mb-4">
          {/* Select for predefined ranges */}
          <Select value={selectedRange} onValueChange={(value) => setSelectedRange(value as 'today' | '7d' | 'week' | '30d' | '120d' | 'year' | 'custom')}>
            <SelectTrigger>
              <SelectValue placeholder="Select Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="120d">Last 120 Days</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {/* DatePicker for custom range */}
          {selectedRange === 'custom' && (
            <div className="flex space-x-2">
                <DatePicker
                label="Start Date"
                selectedDate={customDateRange.start}
                onSelect={(date) => setCustomDateRange((prev) => ({...prev, start: date}))}
                />
                <DatePicker
                label="End Date"
                selectedDate={customDateRange.end}
                onSelect={(date) => setCustomDateRange((prev) => ({...prev, end: date}))}
                />
            </div>
          )}
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <defs>
                {taskTypes.map((taskType, index) => (
                  <linearGradient key={taskType} id={`color${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={getColorForTaskType(taskType)} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={getColorForTaskType(taskType)} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              {/* Customize the Y-axis to make the highest point 2/3 of the way up */}
              <YAxis
                domain={[0, maxValue * 1.5]} // Extend the domain so the maxValue is only 2/3 of the Y-axis
              />
              <Tooltip />
              <Legend />
              {taskTypes.map((taskType, index) => (
                <Area
                  key={taskType}
                  type="monotone"
                  dataKey={taskType}
                  stroke={getColorForTaskType(taskType)} 
                  fillOpacity={1}
                  fill={`url(#color${index})`}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p>No task data available.</p>
        )}
      </CardContent>
    </Card>
  );
};
