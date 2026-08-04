/**
 * Every Cloudinary upload dimension, in one place, keyed by folder.
 *
 * These used to be literals at each call site, which is how `addForm` and
 * `editForm` drifted apart: Express declares `QrImageWidth = 400,
 * QrImageHeight = 150` in both controllers, but `addForm` passed them into
 * `uploadimage(path, folder, height, width)` in the wrong order. The two routes
 * uploaded the same kind of image to the same folder at transposed sizes and
 * nobody noticed, because nothing broke visibly — see the note below on why.
 *
 * `uploadImage` reads this table itself and takes no width/height arguments, so
 * a call site cannot pass the wrong pair, or the right pair the wrong way round.
 * Adding a folder here is the only way to give it a size.
 *
 * ## These are bounds, not target sizes
 *
 * The transformation is `crop: "limit"`: Cloudinary scales the image down to fit
 * *inside* the box, preserving aspect ratio, and never upscales. So a 1000x1000
 * QR code lands at 150x150 under either `400x150` or `150x400` — the smaller
 * side governs, which is why the transposed `addForm` produced identical output
 * for square sources and the bug stayed invisible.
 *
 * It matters that this is `limit` and not `fill`: `fill` would crop to the exact
 * ratio, and a cropped QR code does not scan.
 */
export const IMAGE_SIZES = {
  /** Event cover art on the form/event card. */
  FormImages: {
    width: 196.37,
    height: 350.67,
  },
  /** Payment QR shown on the registration form. */
  QRMediaImages: {
    width: 400,
    height: 150,
  },
  /** Blog hero image. */
  BlogImages: {
    width: 1200,
    height: 800,
  },
  /** Member avatar — square. */
  ProfileImages: {
    width: 512,
    height: 512,
  },
} as const satisfies Record<string, { width: number; height: number }>;

export type ImageFolder = keyof typeof IMAGE_SIZES;
