/* eslint-disable @typescript-eslint/no-explicit-any */

interface ScopedLogger {
  debug: (...args: any[]) => void;
}

export class Logger {
  logScope(scope: string | string[]): ScopedLogger {
    return {
      debug: (...args: any[]): void => {
        console.log(
          `WebExtension::${this.constructor.name}::${scope}`,
          ...args
        );
      },
    };
  }
}
