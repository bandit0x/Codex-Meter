import { invoke } from "@tauri-apps/api/core";
import type { TomatoConnectionSnapshot } from "./capacityTypes";

export function readTomatoConnection(): Promise<TomatoConnectionSnapshot> {
  return invoke<TomatoConnectionSnapshot>("read_tomato_connection");
}
