export function log(
  target: Log,
  propertyName: string,
  propertyDesciptor: PropertyDescriptor
): PropertyDescriptor {
  const method = propertyDesciptor.value;

  propertyDesciptor.value = function(...args: any[]): any {
    const log = {
      debug: (...args: any[]): void => {
        target.debug(propertyName, ...args);
      }
    };
    args.push(log);

    return method.apply(this, args);
  };
  return propertyDesciptor;
}

export class Log {
  debug(scope: string, ...args: any[]): void {
    console.log(`${this.constructor.name}::${scope}:`, ...args);
  }
}
