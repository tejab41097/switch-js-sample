import { useEffect } from 'react';

// Overrides console.log to also append output into the given <pre> ref,
// mirroring the on-page logger from index.html. Restores the original
// console.log on cleanup (important for React 18 StrictMode's double-invoke).
export default function useConsoleLogger(loggerRef) {
  useEffect(() => {
    const originalLog = console.log;

    console.log = function (...args) {
      const logger = loggerRef.current;
      if (logger) {
        for (let i = 0; i < args.length; i++) {
          if (typeof args[i] === 'object') {
            logger.innerHTML += (JSON && JSON.stringify ? JSON.stringify(args[i], undefined, 2) : args[i]) + '<br />';
          } else {
            logger.innerHTML += args[i] + '<br />';
          }
        }
      }
    };

    return () => {
      console.log = originalLog;
    };
  }, [loggerRef]);
}
