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
  /**
   * Event poster on the event card.
   *
   * These were `196.37 x 350.67`, carried over from the Express controllers.
   * Cloudinary takes integer pixel dimensions, so the fractional pair meant the
   * transformation was never applied at all — banners were stored at whatever
   * size they were uploaded. One live poster is a 4320x4320 PNG weighing 3.9 MB,
   * served in full to every visitor of /Events.
   *
   * 1600 is the cap now: comfortably sharp for the featured card at 2x DPI, and
   * roughly a tenth of the bytes. Square because posters here are square and
   * `limit` preserves aspect ratio anyway — the box only sets an upper bound.
   *
   * Only affects new uploads. Images already in Cloudinary keep their size.
   */
  FormImages: {
    width: 1600,
    height: 1600,
  },
  /** Payment QR shown on the registration form. */
  QRMediaImages: {
    width: 400,
    height: 150,
  },
  /**
   * Payment proof a participant uploads on the registration form. Kept large:
   * an admin has to be able to read a UTR and an amount off it, and a UPI
   * confirmation screenshot is a tall phone capture.
   */
  PaymentScreenshots: {
    width: 1200,
    height: 1600,
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
