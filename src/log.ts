/* eslint-disable @typescript-eslint/no-explicit-any */

interface ScopedLogger {
  debug: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

export class Logger {
  public logLevel = "debug";

  logScope(scope: string | string[]): ScopedLogger {
    scope = Array.isArray(scope) ? scope.join(" ") : scope;
    return {
      debug: (...args: any[]): void => {
        if (this.logLevel !== "debug") {
          return;
        }

        console.log(
          `WebExtension::${this.constructor.name}::${scope}`,
          ...args
        );
      },

      error: (...args: any[]): void => {
        console.error(
          `WebExtension::${this.constructor.name}::${scope}`,
          ...args
        );
      },
    };
  }
}
