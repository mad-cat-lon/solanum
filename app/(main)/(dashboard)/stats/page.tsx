"use client";
import { ActivityGraph } from "@/components/demo-dashboard/activity-graph"
import { ActivityChart } from "@/components/demo-dashboard/activity-chart"
import { ActivityProvider } from "@/components/activity-provider";
import ActivitySummary from "@/components/demo-dashboard/activity-summary";

export default function ApplicationPage() {
  return (
    <ActivityProvider>
      <div className="flex flex-col space-y-6">
        <div className="flex items-end justify-between space-y-2 mb-6">
          <h2 className="text-3xl leading-5 font-bold tracking-tight">
          Statistics
          </h2>
        </div>
        <div className="flex-1 space-y-4 pt-6">
          <ActivityGraph/>
        </div>
        <div className="flex flex-row space-x-4 pt-6">
          <div className="flex-1">
            <ActivityChart/>
          </div>
          <div className="w-1/4">
            <ActivitySummary/>
          </div>
        </div>
      </div>
    </ActivityProvider>
  );
};