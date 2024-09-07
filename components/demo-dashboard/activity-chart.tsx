'use client';

import { useEffect, useState } from 'react';
import { collection, query, getDocs, Firestore, Timestamp } from 'firebase/firestore';
import { useFirestore, useUser } from 'reactfire';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format, subDays } from 'date-fns';
import { useActivityData } from '@/components/demo-dashboard/activity-provider';
// Helper function to get color based on activity level
const getActivityColor = (level: number) => {
  const colors = [
    'bg-neutral-100',
    'bg-red-200',
    'bg-red-300',
    'bg-red-400',
    'bg-red-500',
  ];
  return colors[level] || colors[0]; // Default to neutral if level is undefined
};

// Interface for Activity documents from Firestore
interface Activity {
  type: string;
  timestamp: Timestamp;
}

// Utility function to group activities by date
const groupActivitiesByDate = (activities: Activity[]) => {
  const activityMap: Record<string, number> = {};
  activities.forEach((activity) => {
    const dateKey = format(activity.timestamp.toDate(), 'yyyy-MM-dd');
    activityMap[dateKey] = (activityMap[dateKey] || 0) + 1; // Increment activity count per date
  });
  return activityMap;
};

export const ActivityChart: React.FC = () => {
  // const firestore = useFirestore();
  // const { data: user } = useUser();
  const { activities, loading } = useActivityData();
  const [activityMap, setActivityMap] = useState<Record<string, number>>({});
  const days = 365;
  const weeksCount = Math.ceil(days / 7);

  useEffect(() => {
    if (!loading && activities.length > 0) {
      const groupedData = groupActivitiesByDate(activities);
      setActivityMap(groupedData);
    }
  }, [activities, loading]);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Activity Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: weeksCount }).map((_, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  const dataIndex = weekIndex * 7 + dayIndex;
                  if (dataIndex >= days) return null;

                  // Calculate the date in the past for this index
                  const date = subDays(new Date(), days - dataIndex - 1);
                  const dateKey = format(date, 'yyyy-MM-dd');
                  const activityLevel = Math.min(activityMap[dateKey] || 0, 4); // Cap level to 4 (color scale range)

                  return (
                    <Tooltip key={dataIndex}>
                      <TooltipTrigger>
                        <div
                          className={`w-3 h-3 rounded-sm ${getActivityColor(activityLevel)}`}
                          aria-label={`Activity level ${activityLevel} on ${date.toDateString()}`}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-semibold">{date.toDateString()}</p>
                        <p>{activityMap[dateKey] || 0} activities</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};
