import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface AddTelegramContactDialogProps {
  onAdd: (name: string, chatId: string, isGroup: boolean) => void;
}

export const AddTelegramContactDialog = ({ onAdd }: AddTelegramContactDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [chatId, setChatId] = useState("");
  const [isGroup, setIsGroup] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && chatId) {
      onAdd(name, chatId, isGroup);
      setName("");
      setChatId("");
      setIsGroup(false);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Telegram Contact
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Telegram Contact</DialogTitle>
          <DialogDescription>
            Add a Telegram user or group to receive emergency alerts.
            <br />
            <a
              href="https://docs.lovable.dev/tips-tricks/telegram-chat-id"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm"
            >
              How to find your Telegram Chat ID
            </a>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., John Doe or Family Group"
              required
            />
          </div>
          <div>
            <Label htmlFor="chatId">Chat ID</Label>
            <Input
              id="chatId"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="e.g., 123456789 or -1001234567890"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Group chat IDs start with a minus sign (-)
            </p>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="isGroup">Is this a group?</Label>
            <Switch
              id="isGroup"
              checked={isGroup}
              onCheckedChange={setIsGroup}
            />
          </div>
          <Button type="submit" className="w-full">
            Add Contact
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
