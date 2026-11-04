export const MAX_IMAGE_BYTES = 256 * 1024;
export const IMAGE_SIZE = 320;

export function validateHeaderImage(image: string) {
  const prefix = "data:image/png;base64,";
  if (!image.startsWith(prefix)) throw new Error("The header image must be an embedded PNG.");
  const data = image.slice(prefix.length);
  if (!/^iVBORw0KGgo[A-Za-z0-9+/]*={0,2}$/.test(data) || data.length % 4 !== 0) {
    throw new Error("The header image contains invalid PNG data.");
  }
  const bytes = data.length * 3 / 4 - (data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0);
  if (bytes > MAX_IMAGE_BYTES) throw new Error("The header image must be smaller than 256 KB.");
  return image;
}
