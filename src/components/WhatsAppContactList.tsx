import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, TestTube, MessageCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  is_group?: boolean;
}

interface WhatsAppContactListProps {
  contacts: WhatsAppContact[];
  onRemove: (id: string) => void;
  onAdd: () => void;
  onTest: (contact: WhatsAppContact) => void;
}

export const WhatsAppContactList = ({ contacts, onRemove, onAdd, onTest }: WhatsAppContactListProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-foreground">WhatsApp Emergency Contacts</h3>
        <Button onClick={onAdd} size="sm" className="gap-2">
          <MessageCircle className="w-4 h-4" />
          Add Contact
        </Button>
      </div>

      <AnimatePresence mode="popLayout">
        {contacts.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center py-12"
          >
            <Card className="p-8 border-dashed">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">No WhatsApp contacts added yet</p>
              <p className="text-sm text-muted-foreground">Add contacts to receive emergency alerts via WhatsApp</p>
            </Card>
          </motion.div>
        ) : (
          contacts.map((contact, index) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {contact.is_group ? (
                      <Users className="w-5 h-5 text-green-500" />
                    ) : (
                      <MessageCircle className="w-5 h-5 text-green-500" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        {contact.name}
                        {contact.is_group && (
                          <span className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
                            Group
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-muted-foreground">{contact.phone}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onTest(contact)}
                      className="gap-2"
                    >
                      <TestTube className="w-4 h-4" />
                      Test
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onRemove(contact.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  );
};