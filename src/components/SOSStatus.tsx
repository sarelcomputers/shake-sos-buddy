import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

interface SOSStatusProps {
  enabled: boolean;
  shakeCount: number;
  requiredShakes: number;
}

export const SOSStatus = ({ enabled, shakeCount, requiredShakes }: SOSStatusProps) => {
  return (
    <div className="relative">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`relative rounded-3xl p-8 ${
          enabled ? 'bg-gradient-emergency shadow-emergency' : 'bg-gradient-safe shadow-lg'
        }`}
      >
        <div className="text-center space-y-4">
          {enabled ? (
            <>
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <ShieldAlert className="w-24 h-24 mx-auto text-primary-foreground" />
              </motion.div>
              <h2 className="text-3xl font-bold text-primary-foreground">System Armed</h2>
              <p className="text-primary-foreground/90 text-lg">
                Shake your phone {requiredShakes} times to trigger emergency alert
              </p>
              {shakeCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-background/20 backdrop-blur-sm rounded-xl p-4"
                >
                  <p className="text-2xl font-bold text-primary-foreground">
                    {shakeCount}/{requiredShakes} shakes detected
                  </p>
                </motion.div>
              )}
            </>
          ) : (
            <>
              <ShieldCheck className="w-24 h-24 mx-auto text-safe" />
              <h2 className="text-3xl font-bold text-foreground">System Disarmed</h2>
              <p className="text-muted-foreground text-lg">
                Enable the system to activate shake detection
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
