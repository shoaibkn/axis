import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const getEnv = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
};

const getR2Client = () => {
  const accountId = getEnv("R2_ACCOUNT_ID");
  const accessKeyId = getEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = getEnv("R2_SECRET_ACCESS_KEY");

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
};

export const getPublicObjectUrl = (key: string) => {
  const publicBaseUrl = getEnv("R2_PUBLIC_BASE_URL").replace(/\/$/, "");
  return `${publicBaseUrl}/${key}`;
};

export const createOrgImageUploadUrl = async (args: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}) => {
  const bucket = getEnv("R2_BUCKET");
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: args.key,
    ContentType: args.contentType,
  });

  const uploadUrl = await getSignedUrl(getR2Client(), command, {
    expiresIn: args.expiresInSeconds ?? 300,
  });

  return {
    uploadUrl,
    key: args.key,
    publicUrl: getPublicObjectUrl(args.key),
  };
};

export const uploadRemoteImageToR2 = async (args: {
  key: string;
  imageUrl: string;
  contentType: string;
}) => {
  const bucket = getEnv("R2_BUCKET");
  const response = await fetch(args.imageUrl);
  if (!response.ok) {
    throw new Error("Unable to download the selected preset image");
  }

  const bytes = new Uint8Array(await response.arrayBuffer());

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: args.key,
      ContentType: args.contentType,
      Body: bytes,
    }),
  );

  return {
    key: args.key,
    publicUrl: getPublicObjectUrl(args.key),
  };
};
