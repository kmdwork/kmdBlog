import { fileTypeFromBuffer } from "file-type";
import {
  IMAGE_DETECTION_BYTES,
  imageTypeFromExtension,
  type AllowedImageType,
} from "./policy";

export async function detectAllowedImageType(
  file: File,
): Promise<AllowedImageType | null> {
  const sample = await file.slice(0, IMAGE_DETECTION_BYTES).arrayBuffer();
  const detected = await fileTypeFromBuffer(sample);

  if (!detected) return null;

  const allowed = imageTypeFromExtension(detected.ext);
  if (!allowed || detected.mime !== allowed.mime) return null;

  return allowed;
}
