import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, Mic, MicOff } from 'lucide-react';

interface SOSStatusProps {
  enabled: boolean;
  shakeCount: number;
  requiredShakes: number;
  voiceEnabled?: boolean;
  voicePassword?: string;
}

export const SOSStatus = ({ enabled, shakeCount, requiredShakes, voiceEnabled, voicePassword }: SOSStatusProps) => {
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
              
              {/* Voice trigger status */}
              {voiceEnabled && voicePassword && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-2 bg-background/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-primary-foreground/30"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Mic className="w-5 h-5 text-primary-foreground" />
                  </motion.div>
                  <span className="text-primary-foreground text-sm font-medium">
                    Voice active - say "{voicePassword}"
                  </span>
                </motion.div>
              )}
              {shakeCount > 0 ? (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: [1, 1.05, 1],
                    opacity: 1
                  }}
                  transition={{
                    scale: {
                      duration: 0.3,
                      repeat: Infinity,
                      repeatDelay: 0.5
                    }
                  }}
                  className="bg-background/30 backdrop-blur-md rounded-2xl p-6 border-2 border-primary-foreground/30 shadow-2xl"
                >
                  <div className="space-y-2">
                    <p className="text-4xl font-black text-primary-foreground tracking-tight">
                      {shakeCount}/{requiredShakes}
                    </p>
                    <p className="text-sm font-semibold text-primary-foreground/90 uppercase tracking-wider">
                      Shakes Detected
                    </p>
                    <div className="w-full bg-background/40 rounded-full h-3 mt-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(shakeCount / requiredShakes) * 100}%` }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="bg-primary-foreground h-3 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-background/10 backdrop-blur-sm rounded-xl p-4 border border-primary-foreground/20"
                >
                  <p className="text-lg font-semibold text-primary-foreground/80">
                    0/{requiredShakes} - Start shaking to trigger
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
