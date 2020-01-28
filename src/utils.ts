export const injectScript = (scriptSrc: string): Promise<void> => {
  return new Promise(resolve => {
    const script = document.createElement("script");
    script.src = scriptSrc;
    script.async = true;
    script.onload = (): void => resolve();
    document.body.append(script);
  });
};
