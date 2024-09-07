import { FC } from "react";
import Image from "next/image";
import { MainNav } from "@/components/demo-dashboard/main-nav";
import { RecentSales } from "@/components/demo-dashboard/recent-sales";
import { ActivityGraph } from "@/components/demo-dashboard/activity-graph"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

export const Statistics: FC = () => {
  return (
    <>
      <div className="md:hidden">
        <Image
          src="/examples/dashboard-light.png"
          width={1280}
          height={866}
          alt="Statistics"
          className="block dark:hidden"
        />
        <Image
          src="/examples/dashboard-dark.png"
          width={1280}
          height={866}
          alt="Statistics"
          className="hidden dark:block"
        />
      </div>
      <div className="hidden flex-col md:flex">
        <div className="flex items-end justify-between space-y-2 mb-6">
          <h2 className="text-3xl leading-5 font-bold tracking-tight">
          Statistics
          </h2>
        </div>
        <div className="flex-1 space-y-4 pt-6">
          <ActivityGraph/>
        </div>
      </div>
    </>
  );
};
