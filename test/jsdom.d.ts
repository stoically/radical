// replace with @types/jsdom once matrix-react-sdk compiles
// with its @types/parse5 dependency
declare module "jsdom" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  class JSDOM {
    constructor(html?: string);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window: any;
  }
}
