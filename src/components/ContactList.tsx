import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Phone, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Contact } from '@/hooks/useSOSSettings';

interface ContactListProps {
  contacts: Contact[];
  onRemove: (id: string) => void;
  onAdd: () => void;
}

export const ContactList = ({ contacts, onRemove, onAdd }: ContactListProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-foreground">Emergency Contacts</h3>
        <Button onClick={onAdd} size="sm" className="bg-primary hover:bg-primary/90">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Contact
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
              <Phone className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No emergency contacts added yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add contacts who will receive your SOS alerts
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
                        <Phone className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.phone}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemove(contact.id)}
                      className="hover:bg-destructive/20 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
