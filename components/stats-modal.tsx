import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ActivityGraph } from "@/components/demo-dashboard/activity-graph";
import { ActivityChart } from "@/components/demo-dashboard/activity-chart";
import { ActivityProvider, useActivityData } from '@/components/activity-provider';
import ActivitySummary from "@/components/demo-dashboard/activity-summary";
import { Settings } from "@/types/common";

function StatsModal({ isOpen, onClose, settings }: { isOpen: boolean, onClose: () => void, settings: Settings }) {

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-4 sm:p-6 max-w-full max-h-full md:max-w-3xl lg:max-w-5xl overflow-auto">
        <DialogHeader>
          <DialogTitle>stats</DialogTitle>
        </DialogHeader>
        <ActivityProvider settings={settings}>
          <div className="flex flex-col space-y-6">
            <div className="flex-1 space-y-4 pt-6">
              <ActivityGraph />
            </div>
          </div>
        </ActivityProvider>
        <div className="flex justify-end space-x-4 pt-4">
          <Button onClick={onClose}>close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { StatsModal };
