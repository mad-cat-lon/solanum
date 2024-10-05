import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ActivityGraph } from "@/components/demo-dashboard/activity-graph";
import { ActivityChart } from "@/components/demo-dashboard/activity-chart";
import { ActivityProvider } from "@/components/activity-provider";
import ActivitySummary from "@/components/demo-dashboard/activity-summary";
import { Activity, Settings } from "@/types/common";

function StatsModal({ isOpen, onClose, activities, settings }: { isOpen: boolean, onClose: () => void, activities: Activity[], settings: Settings }) {

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-4 sm:p-6 max-w-full max-h-full md:max-w-3xl lg:max-w-5xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>stats</DialogTitle>
        </DialogHeader>

        <ActivityProvider activities={activities} settings={settings}>
          <div className="flex flex-col space-y-6">
            <div className="flex-1 space-y-4 pt-6">
              <ActivityGraph />
            </div>
            <div className="flex flex-col space-y-4 pt-6 sm:space-y-0 sm:flex-row sm:space-x-4">
              <div className="flex-1">
                <ActivityChart />
              </div>
              <div className="w-full sm:w-1/4">
                <ActivitySummary />
              </div>
            </div>
          </div>
        </ActivityProvider>

        <DialogFooter className="flex justify-end space-x-4 pt-4">
          <Button onClick={onClose}>
            close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { StatsModal };
