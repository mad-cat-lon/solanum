"use client";
import { FC } from "react";
import Image from "next/image";
import { ActivityGraph } from "@/components/demo-dashboard/activity-graph"
import { ActivityChart } from "@/components/demo-dashboard/activity-chart"
import { ActivityProvider } from "@/components/demo-dashboard/activity-provider";

export const Statistics: FC = () => {
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
        <div className="flex-1 space-y-4 pt-6">
          <ActivityChart/>
        </div>
      </div>
    </ActivityProvider>
  );
};
