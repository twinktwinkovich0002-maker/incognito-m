import AWS from 'aws-sdk';
import dotenv from 'dotenv';
dotenv.config();

const s3 = new AWS.S3({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  signatureVersion: 'v4'
});

export const getPresignedUploadUrl = async (key: string, contentType: string, expiresSec = 300) => {
  const params = {
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    Expires: expiresSec,
    ContentType: contentType
  };
  return s3.getSignedUrlPromise('putObject', params);
};

export default { getPresignedUploadUrl };
