import React from "react";
import { Cloud, FolderOpen, Files } from "lucide-react";

/** Generic ISC-licensed Lucide icons; no proprietary provider artwork. */
export function NBCloudBrand({provider}:{provider:"google"|"onedrive"|"icloud"}) {
  const Icon = provider === "google" ? FolderOpen : provider === "onedrive" ? Files : Cloud;
  return <span className="nb-cloud-marks" aria-hidden="true"><Icon width="24" height="24"/></span>;
}
