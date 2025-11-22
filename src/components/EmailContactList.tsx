import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Mail, UserPlus, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export interface EmailContact {
  id: string;
  name: string;
  email: string;
}

interface EmailContactListProps {
  contacts: EmailContact[];
  onRemove: (id: string) => void;
  onAdd: () => void;
  onTest: (contact: EmailContact) => void;
}

export const EmailContactList = ({ contacts, onRemove, onAdd, onTest }: EmailContactListProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-foreground">Emergency Emails</h3>
        <Button onClick={onAdd} size="sm" className="bg-primary hover:bg-primary/90">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Email
        </Button>
      </div>
      
      <AnimatePresence mode="popLayout">
        {contacts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="p-8 text-center border-dashed">
              <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No emergency emails added yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add email contacts who will receive your SOS alerts
              </p>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact, index) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-4 hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <Mail className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onTest(contact)}
                        className="hover:bg-primary/10"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Test
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemove(contact.id)}
                        className="hover:bg-destructive/20 hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};