/* eslint-disable @typescript-eslint/no-explicit-any */

interface ScopedLogger {
  debug: (...args: any[]) => void;
}

export class Logger {
  static DEBUG = process.env.NODE_ENV === "development" ? true : false;

  logScope(scope: string | string[]): ScopedLogger {
    return {
      debug: (...args: any[]): void => {
        if (!Logger.DEBUG) {
          return;
        }

        console.log(
          `WebExtension::${this.constructor.name}::${scope}`,
          ...args
        );
      },
    };
  }
}
