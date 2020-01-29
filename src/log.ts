/* eslint-disable @typescript-eslint/no-explicit-any */
export class Logger {
  logger(scope: string | string[]): { debug: (...args: any[]) => void } {
    scope = Array.isArray(scope) ? scope.join(" ") : scope;
    return {
      debug: (...args: any[]): void => {
        console.log(
          `WebExtension::${this.constructor.name}::${scope}`,
          ...args
        );
      }
    };
  }
}
