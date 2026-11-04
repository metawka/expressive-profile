import { IMAGE_SIZE, validateHeaderImage } from "../render/image";

export async function uploadHeaderImage(file: File) {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    throw new Error("Choose a PNG, JPEG or WebP image.");
  }
  if (file.size > 10 * 1024 * 1024) throw new Error("Choose an image smaller than 10 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = IMAGE_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser could not prepare the image.");
    const edge = Math.min(image.naturalWidth, image.naturalHeight);
    ctx.drawImage(image, (image.naturalWidth - edge) / 2, (image.naturalHeight - edge) / 2, edge, edge, 0, 0, IMAGE_SIZE, IMAGE_SIZE);
    return validateHeaderImage(canvas.toDataURL("image/png"));
  } finally {
    URL.revokeObjectURL(url);
  }
}
