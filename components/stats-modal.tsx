import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ActivityGraph } from "@/components/demo-dashboard/activity-graph";
import { ActivityChart } from "@/components/demo-dashboard/activity-chart";
import { ActivityProvider } from "@/components/demo-dashboard/activity-provider";
import ActivitySummary from "@/components/demo-dashboard/activity-summary";

function StatsModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-4 sm:p-6 max-w-5xl">
        <DialogHeader>
          <DialogTitle>Stats</DialogTitle>
        </DialogHeader>

        <ActivityProvider>
          <div className="flex flex-col space-y-6">
            <div className="flex-1 space-y-4 pt-6">
              <ActivityGraph />
            </div>
            <div className="flex flex-row space-x-4 pt-6">
              <div className="flex-1">
                <ActivityChart />
              </div>
              <div className="w-1/4">
                <ActivitySummary />
              </div>
            </div>
          </div>
        </ActivityProvider>

        <DialogFooter className="flex justify-end space-x-4 pt-4">
          <Button onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { StatsModal };
