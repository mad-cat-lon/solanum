import { Dialog, DialogOverlay, DialogContent, DialogTitle } from "@/components/ui/dialog";
interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal = ({ title, isOpen, onClose, children }: ModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay />
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <div>{children}</div>
      </DialogContent>
    </Dialog>
  );
};