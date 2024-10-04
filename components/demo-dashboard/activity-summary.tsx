import React, { useMemo } from 'react';
import { useActivityData } from '@/components/activity-provider';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';

// Helper functions to calculate start of day, week, and month
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const startOfWeek = (date: Date) => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Sunday is day 0
  return new Date(date.setDate(diff));
};
const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const ActivitySummary: React.FC = () => {
  const { activities, loading } = useActivityData();

  // Calculate daily, weekly, and total activities
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const {
    dailyCount,
    weeklyCount,
    monthlyCount,
    totalCount,
    dailyAvg,
    weeklyAvg,
  } = useMemo(() => {
    const todayActivities = activities.filter(
      (activity) => activity.timestamp && activity.timestamp.toDate() >= todayStart
    );
    const weeklyActivities = activities.filter(
      (activity) => activity.timestamp && activity.timestamp.toDate() >= weekStart
    );
    const monthlyActivities = activities.filter(
      (activity) => activity.timestamp && activity.timestamp.toDate() >= monthStart
    );

    const totalActivities = activities.length;
    const daysThisMonth = now.getDate(); // Current day of the month
    const weeksThisMonth = Math.ceil(daysThisMonth / 7);

    return {
      dailyCount: todayActivities.length,
      weeklyCount: weeklyActivities.length,
      monthlyCount: monthlyActivities.length,
      totalCount: totalActivities,
      dailyAvg: totalActivities / daysThisMonth || 0,
      weeklyAvg: totalActivities / weeksThisMonth || 0,
    };
  }, [activities, todayStart, weekStart, monthStart, now]);

  if (loading) return <div>Loading...</div>;

  return (
    <Card className="p-4 space-y-2">
      <CardHeader className="pb-1">
        <CardTitle className="text-lg">Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm font-medium">Today</span>
          <Badge variant="outline" className="text-xs">{dailyCount} tasks</Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-medium">This Week</span>
          <Badge variant="outline" className="text-xs">{weeklyCount} tasks</Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-medium">This Month</span>
          <Badge variant="outline" className="text-xs">{monthlyCount} tasks</Badge>
        </div>
        <Separator className="my-2" />
        <div className="flex justify-between">
          <span className="text-sm font-medium">Total</span>
          <Badge variant="outline" className="text-xs">{totalCount} tasks</Badge>
        </div>
        <Separator className="my-2" />
        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span>Daily Avg:</span>
            <span>{dailyAvg.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Weekly Avg:</span>
            <span>{weeklyAvg.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivitySummary;
