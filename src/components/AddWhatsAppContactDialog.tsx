import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MessageCircle } from 'lucide-react';

interface AddWhatsAppContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (contact: { name: string; phone: string; is_group: boolean }) => void;
}

export const AddWhatsAppContactDialog = ({ open, onOpenChange, onAdd }: AddWhatsAppContactDialogProps) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isGroup, setIsGroup] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && phone) {
      onAdd({ name, phone, is_group: isGroup });
      setName('');
      setPhone('');
      setIsGroup(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-500" />
            Add WhatsApp Contact
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Contact Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1234567890"
              required
            />
            <p className="text-xs text-muted-foreground">
              Include country code (e.g., +1 for US, +27 for South Africa)
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="isGroup">WhatsApp Group</Label>
              <p className="text-xs text-muted-foreground">
                Enable if this is a group chat
              </p>
            </div>
            <Switch
              id="isGroup"
              checked={isGroup}
              onCheckedChange={setIsGroup}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Contact</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};