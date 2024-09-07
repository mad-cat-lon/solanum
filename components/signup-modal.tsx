import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Link from "next/link"

function SignupModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign Up Required</DialogTitle>
        </DialogHeader>
        <p>You need to sign up to use this feature. Please sign up or log in to continue.</p>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { SignupModal }