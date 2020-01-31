/* eslint-disable @typescript-eslint/no-explicit-any */
export class Logger {
  public logLevel = "debug";

  logger(scope: string | string[]): { debug: (...args: any[]) => void } {
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
    };
  }
}
