import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Users } from "lucide-react";
import { motion } from "framer-motion";

interface TelegramContact {
  id: string;
  name: string;
  chat_id: string;
  is_group: boolean;
}

interface TelegramContactListProps {
  contacts: TelegramContact[];
  onRemove: (id: string) => void;
}

export const TelegramContactList = ({ contacts, onRemove }: TelegramContactListProps) => {
  return (
    <div className="space-y-2">
      {contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No Telegram contacts added yet
        </p>
      ) : (
        contacts.map((contact, index) => (
          <motion.div
            key={contact.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {contact.is_group && <Users className="h-4 w-4 text-primary" />}
                <div>
                  <p className="font-medium">{contact.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Chat ID: {contact.chat_id}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(contact.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          </motion.div>
        ))
      )}
    </div>
  );
};
