export type PixelCrop = { x: number; y: number; width: number; height: number };

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (e) => reject(e));
    img.src = url;
  });
}

// Crop the source image to the chosen pixel region and return a JPEG blob,
// scaled down so covers stay a reasonable size.
export async function getCroppedBlob(
  imageSrc: string,
  crop: PixelCrop,
  maxWidth = 1600,
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const scale = crop.width > maxWidth ? maxWidth / crop.width : 1;
  const w = Math.round(crop.width * scale);
  const h = Math.round(crop.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, w, h);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Crop failed"))),
      "image/jpeg",
      0.9,
    );
  });
}
