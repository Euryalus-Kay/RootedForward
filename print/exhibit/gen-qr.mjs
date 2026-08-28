/* The exhibition QR. Encodes rooted-forward.org/go/exhibit, which is
   re-pointable in src/lib/qr-links.ts for as long as the domain lives.
   Error correction Q, forest modules, no background; the sheet gives
   it a cream tile with its own quiet zone.
     node print/exhibit/gen-qr.mjs                                    */
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "../../node_modules/qrcode/lib/index.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const URL = "https://rooted-forward.org/go/exhibit";
const svg = await QRCode.toString(URL, {
  type: "svg",
  errorCorrectionLevel: "Q",
  margin: 0,
  color: { dark: "#1B3A2D", light: "#0000" },
});
writeFileSync(join(HERE, "assets/qr-exhibit.svg"), svg);
console.log("qr-exhibit.svg encodes", URL);
