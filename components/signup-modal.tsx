import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Link from "next/link"

function SignupModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-4 sm:p-6 max-w-xs sm:max-w-md">
        <DialogHeader>
          <DialogTitle>signup required</DialogTitle>
        </DialogHeader>
        <p className="text-sm sm:text-base mb-4">
            you need to sign up to use this feature. please sign up or log in to continue.
        </p>
        <DialogFooter className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <Button onClick={onClose} className="w-full sm:w-auto">
            close
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/login">login</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { SignupModal }