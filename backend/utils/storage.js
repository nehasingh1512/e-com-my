import fs from "fs";
import path from "path";
import crypto from "crypto";

// Local disk is the default (zero config, works everywhere for local dev).
// Set S3_BUCKET + S3_ACCESS_KEY_ID + S3_SECRET_ACCESS_KEY to switch to
// S3-compatible object storage instead — this works with real AWS S3, and
// with any S3-compatible provider (Cloudflare R2, DigitalOcean Spaces,
// MinIO, Backblaze B2) by also setting S3_ENDPOINT.
//
// This matters for real deployments: most PaaS hosts (Render, Railway,
// Heroku, etc.) use an ephemeral filesystem, so anything written to local
// disk disappears on the next deploy/restart. Local disk storage is fine for
// a single self-hosted server with a persistent volume (see docker-compose.yml),
// but not for most managed platform deploys.
const USE_S3 = Boolean(
  process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
);

const uploadDir = path.join(process.cwd(), "uploads");
if (!USE_S3 && !fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const makeFilename = (originalname) => {
  const ext = path.extname(originalname);
  return `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
};

let cachedS3Client = null;
const getS3Client = async () => {
  if (cachedS3Client) return cachedS3Client;
  const { S3Client } = await import("@aws-sdk/client-s3");
  cachedS3Client = new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || undefined, // leave unset for real AWS S3
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true", // needed for MinIO/some providers
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  });
  return cachedS3Client;
};

// Saves one uploaded file (multer memoryStorage buffer) to whichever backend
// is configured, and returns a URL usable directly in <img src>.
export const saveFile = async (file) => {
  const filename = makeFilename(file.originalname);

  if (USE_S3) {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await getS3Client();
    const key = `uploads/${filename}`;

    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: process.env.S3_ACL || "public-read",
      })
    );

    if (process.env.S3_PUBLIC_URL_BASE) {
      return `${process.env.S3_PUBLIC_URL_BASE.replace(/\/$/, "")}/${key}`;
    }
    return `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION || "us-east-1"}.amazonaws.com/${key}`;
  }

  fs.writeFileSync(path.join(uploadDir, filename), file.buffer);
  return `/uploads/${filename}`;
};

export const isCloudStorageEnabled = () => USE_S3;
