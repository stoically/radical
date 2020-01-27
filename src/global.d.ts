import { Background } from "./background";

declare global {
  interface Window {
    background: Background;
    vector_indexeddb_worker_script: string;
  }
}
