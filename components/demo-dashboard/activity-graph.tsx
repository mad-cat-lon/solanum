'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { format, startOfWeek, subDays, subMonths, subYears } from 'date-fns';
import { DatePicker } from '@/components/ui/date-picker'; 
import { useActivityData } from '@/components/activity-provider';
import { useTheme } from "next-themes";
import { Activity } from "@/types/common";

// Define the shape of the chart data
interface ChartData {
  date: string;
  [key: string]: number | string; // Dynamic keys for task types
}

export const ActivityGraph: React.FC = () => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [activityCategories, setActivityCategories] = useState<string[]>([]); // To store unique task types dynamically
  const [maxValue, setMaxValue] = useState<number>(0); // To store max value
  const [selectedCategory, setSelectedCategory] = useState<string>('all'); // For category filter
  const [totalTaskCount, setTotalTaskCount] = useState<number>(0);// for the total number of time spent
  const [viewType, setViewType] = useState<'lineChart' | 'stackedBarChart' | 'cumulative'>('lineChart');

  const { theme } = useTheme(); // Access current theme
  
  const tooltipStyles = {
    backgroundColor: theme === "dark" ? "#000000" : "#FFFFFF", // Dark/light background
    color: theme === "dark" ? "#FFFFFF" : "#000000", // Dark/light text
    borderRadius: "8px",
    padding: "8px",
    border: "none"
  };

  // State for date filtering
  const [selectedRange, setSelectedRange] = useState<'today' | '7d' | 'week' | '30d' | '120d' | 'year' | 'custom'>('7d');
  const [customDateRange, setCustomDateRange] = useState<{ start: Date | undefined; end: Date | undefined }>({
    start: undefined,
    end: undefined,
  });
  const { activities, settings, loading, categoryColors, fetchMoreActivities } = useActivityData();
  
  useEffect(() => {
    if (!loading && activities.length > 0) {
      const { start, end } = getDateRange();
      const filteredActivities = activities.filter(activity => {
        const activityDate = activity.timestamp.toDate();  
        const localActivityDate = new Date(activityDate);
        if (start && end) {
          return localActivityDate  >= start && localActivityDate  <= end;
        }
        return false;
      });
  
      const processActivityData = (activities: Activity[]): ChartData[] => {
        const activityData: Record<string, Record<string, number | string>> = {}; 
        const categoriesSet = new Set<string>();
        let globalMaxValue = 0; 
  
        // Get the min and max dates in the activity list
        let minDate: Date = new Date();
        let maxDate: Date = new Date();

        minDate.setHours(0, 0, 0, 0);
        maxDate.setHours(23, 59, 59, 999); 
        
        filteredActivities.forEach(activity => {
          const { timestamp, type } = activity;
          const date = timestamp.toDate();
  
          if (!minDate || date < minDate) minDate = date;
          if (!maxDate || date > maxDate) maxDate = date;
  
          categoriesSet.add(type);
        });

        if (!minDate || !maxDate) {
          // No valid activities, return early
          return [];
        }
  
        if (maxDate) {
          maxDate.setHours(23, 59, 59, 999);
        }

        if (!minDate) {
          minDate = new Date();
          minDate.setHours(0, 0, 0, 0); // Start of today
        }

        const dateRange: string[] = [];
        let currentDate = new Date(minDate); // Ensure currentDate is a Date object
  
        const isToday = selectedRange === 'today';
  
        while (currentDate <= maxDate) {
          const formattedDate = isToday
            ? format(currentDate, 'HH') // Group by hour if it's today
            : format(currentDate, 'yyyy-MM-dd'); // Otherwise group by day
          dateRange.push(formattedDate);
          if (isToday) {
            currentDate.setHours(currentDate.getHours() + 1);
          } else {
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }

        filteredActivities.forEach(activity => {
          const { timestamp, type } = activity;
          const date = timestamp.toDate();
          const formattedDate = isToday
            ? format(date, 'HH')
            : format(date, 'yyyy-MM-dd');
  
          if (!activityData[formattedDate]) {
            activityData[formattedDate] = { date: formattedDate };
          }
  
          // Increment the task count
          activityData[formattedDate][type] = (activityData[formattedDate][type] || 0) as number + 1;
          globalMaxValue = Math.max(globalMaxValue, activityData[formattedDate][type] as number);
        });
  
        //  autofill missing tasks with zero
        const completeData: ChartData[] = dateRange.map(date => {
          const dayData: ChartData = { date }; // Initialize each day's or hour's data
            categoriesSet.forEach(type => {
            dayData[type] = (activityData[date]?.[type] || 0) as number; // Use '0' for missing types
          });
  
          return dayData;
        });
  
        setActivityCategories(Array.from(categoriesSet)); 
        setMaxValue(globalMaxValue);
  
        return completeData;
      };
  
      setChartData(processActivityData(filteredActivities));

    }
  }, [activities, selectedRange, customDateRange, loading, viewType, selectedCategory]);

  useEffect(() => {
    const { start, end } = getDateRange();
    if (start && end) {
      fetchMoreActivities(start, end);
    }
  }, [selectedRange, customDateRange]);


  useEffect(() => {
    if (chartData.length > 0) {
      const totalTaskCount = chartData.reduce((total, data) => {
        if (selectedCategory === 'all') {
          // Filter out "Short Break" and "Long Break" and then calculate the total
          return total + activityCategories
            .filter((type) => type !== 'Short Break' && type !== 'Long Break')
            .reduce((sum, type) => sum + (data[type] as number), 0);
        }
        // If a specific category is selected, check if it's not "Short Break" or "Long Break"
        return total + (selectedCategory !== 'Short Break' && selectedCategory !== 'Long Break' 
          ? (data[selectedCategory] as number || 0) 
          : 0);
      }, 0);
      setTotalTaskCount(totalTaskCount);
    }
  }, [chartData, selectedCategory, activityCategories]);

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
  const getColorForCategory = (category: string) => {
    return categoryColors[category] || generateRandomHexColor();
  };


  // Function to get date range based on selected filter
  const getDateRange = () => {
    const now = new Date();
    switch (selectedRange) {
      case '7d':
        const end = new Date(now);
        end.setHours(23, 59, 59, 999); 
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
        return {
          start: customDateRange.start || null,
          end: customDateRange.end || null
        }
      default:
        return { start: null, end: null };
    }
  };

  // Filter chart data based on the selected category and date range
  const filteredChartData = useMemo(() => {
    return selectedCategory === 'all'
      ? chartData
      : chartData.map(data => ({
          date: data.date,
          [selectedCategory]: data[selectedCategory] || 0,
        }));
  }, [chartData, selectedCategory, selectedRange]);

  // Function to render the chart based on the selected view type
  const renderChart = () => {
    switch (viewType) {
      case 'lineChart':
        return (
          <AreaChart data={filteredChartData}>
            <defs>
            {selectedCategory === 'all'
              ? activityCategories.map((category, index) => (
                  <linearGradient key={category} id={`color${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={getColorForCategory(category)} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={getColorForCategory(category)} stopOpacity={0} />
                  </linearGradient>
                ))
              : 
                <linearGradient id={`color0`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={getColorForCategory(selectedCategory)} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={getColorForCategory(selectedCategory)} stopOpacity={0} />
                </linearGradient>
            }
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis
              domain={[0, maxValue * 1.5]}
              tickFormatter={(tick: number) => `${Math.round(tick)}`} 
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={tooltipStyles}
            />
            <Legend />
            {selectedCategory === 'all' ? (
              activityCategories.map((category, index) => (
                <Area
                  key={category}
                  type="monotone"
                  dataKey={category}
                  stroke={getColorForCategory(category)} 
                  fillOpacity={1}
                  fill={`url(#color${index})`}
                />
              ))
            ) : (
              <Area
                type="monotone"
                dataKey={selectedCategory}
                stroke={getColorForCategory(selectedCategory)}
                fillOpacity={1}
                fill={`url(#color0)`}
              />
            )}
          </AreaChart>
        );
      case 'stackedBarChart':
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis 
              domain={[0, maxValue * 1.5]}
              tickFormatter={(tick: number) => `${Math.round(tick)}`} 
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={tooltipStyles}
            />
            <Legend />
            {selectedCategory === 'all' ? (
                activityCategories.map((category, index) => (
                  <Bar key={category} dataKey={category} stackId="a" fill={getColorForCategory(category)} />
                ))
              )
              : (
                <Bar dataKey={selectedCategory} fill={getColorForCategory(selectedCategory)}/>
              )
            }
          </BarChart>
        );
      case 'cumulative':
        // Calculate cumulative values
        const cumulativeData = chartData.reduce((acc, data, index) => {
          const prev = acc[index - 1] || {};
          const current: ChartData = { date: data.date };
          activityCategories.forEach((category) => {
            current[category] = (prev[category] as number || 0) + (data[category] as number || 0);
          });
          acc.push(current);
          return acc;
        }, [] as ChartData[]);
        return (
          <LineChart data={cumulativeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis
              tickFormatter={(tick: number) => `${Math.round(tick)}`} 
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={tooltipStyles}
            />
            <Legend />
            {selectedCategory === 'all' ? (
                activityCategories.map((category, index) => (
                  <Line key={category} dataKey={category} stroke={getColorForCategory(category)} />
                ))
              )
              : (
                <Line dataKey={selectedCategory} stroke={getColorForCategory(selectedCategory)}/>
              )
            }
          </LineChart>
        );
      default:
        return <></>;
    }
  };

  const calculateTotalTaskTime = () => {
    const totalMinutes = totalTaskCount * (settings.defaultTimeLength as number);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours} hours and ${minutes} minutes`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>you locked in {totalTaskCount} times for a total of {calculateTotalTaskTime()}.</CardTitle>
        <CardDescription>
          task counts per date, categorized by task type
        </CardDescription>
      </CardHeader>
      <CardContent>

        <div className="flex space-x-4 mb-4">
          <Select value={selectedRange} onValueChange={(value) => setSelectedRange(value as 'today' | '7d' | 'week' | '30d' | '120d' | 'year' | 'custom')}>
            <SelectTrigger>
              <SelectValue placeholder="select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">last 7 days</SelectItem>
              <SelectItem value="today">today</SelectItem>
              <SelectItem value="week">this week</SelectItem>
              <SelectItem value="30d">last 30 days</SelectItem>
              <SelectItem value="120d">last 120 days</SelectItem>
              <SelectItem value="year">last year</SelectItem>
              <SelectItem value="custom">custom range</SelectItem>
            </SelectContent>
          </Select>

          {selectedRange === 'custom' && (
            <div className="flex space-x-2">
                <DatePicker
                  label="start date"
                  selectedDate={customDateRange.start || undefined}
                  onSelect={(date) => setCustomDateRange((prev) => ({...prev, start: date || undefined}))}
                />
                <DatePicker
                  label="end date"
                  selectedDate={customDateRange.end || undefined}
                  onSelect={(date) => setCustomDateRange((prev) => ({...prev, end: date || undefined}))}
                />
            </div>
          )}
          
        <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value)}>
          <SelectTrigger>
            <SelectValue placeholder="select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">all categories</SelectItem>
            {activityCategories.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={viewType} onValueChange={(value) => setViewType(value as 'lineChart' | 'stackedBarChart' | 'cumulative')}>
          <SelectTrigger>
            <SelectValue placeholder="Select View" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lineChart">line chart</SelectItem>
            <SelectItem value="stackedBarChart">stacked bar chart</SelectItem>
            <SelectItem value="cumulative">cumulative chart</SelectItem>
          </SelectContent>
        </Select>

        </div>
        {filteredChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            {renderChart()}
          </ResponsiveContainer>
        ) : (
          <p>no task data available.</p>
        )}
      </CardContent>
    </Card>
  );
};
