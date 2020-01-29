/* eslint-disable @typescript-eslint/no-explicit-any */
export class Logger {
  logger(scope: string): { debug: (...args: any[]) => void } {
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
