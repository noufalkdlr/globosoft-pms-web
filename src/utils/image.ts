// Turns the picture a person chose into a small square, so what is uploaded is
// a few kilobytes instead of a phone photo, and the backend never has to crop.

export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const AVATAR_PIXELS = 256;
// A file this big is not worth decoding
const MAX_SOURCE_BYTES = 15 * 1024 * 1024;

// Crops the middle square of the picture and shrinks it. Throws an Error whose
// message can be shown to the person.
export async function cropToSquare(file: File, pixels = AVATAR_PIXELS): Promise<Blob> {
  if (!AVATAR_TYPES.includes(file.type)) {
    throw new Error("Choose a JPEG, PNG or WebP picture.");
  }

  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("That picture is too large. Choose one under 15 MB.");
  }

  let bitmap: ImageBitmap;

  try {
    // "from-image" keeps a phone photo the right way up
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("That file couldn't be read as a picture.");
  }

  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = pixels;
  canvas.height = pixels;

  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close();
    throw new Error("This browser can't prepare the picture.");
  }

  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    pixels,
    pixels,
  );
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.85),
  );

  if (!blob) {
    throw new Error("This browser can't prepare the picture.");
  }

  return blob;
}
