import { invoke } from "@tauri-apps/api/core";
import type { ZCodeQuotaSnapshot } from "./capacityTypes";

export function readZcodeQuotaSnapshot(): Promise<ZCodeQuotaSnapshot> {
  return invoke<ZCodeQuotaSnapshot>("read_zcode_quota_snapshot");
}
