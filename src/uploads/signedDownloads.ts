import {createHmac, timingSafeEqual} from "node:crypto";

const SIGNED_DOWNLOAD_TTL_SECONDS = 5 * 60;

export function createSignedDownloadPath(
  signingKey: Buffer,
  fileId: number,
  nowSeconds: number = currentUnixTime(),
): string {
  const expires = nowSeconds + SIGNED_DOWNLOAD_TTL_SECONDS;
  const signature = signDownload(signingKey, fileId, expires);
  return `/files/${fileId}/signed-download?expires=${expires}&signature=${signature}`;
}

export function verifySignedDownload(
  _signingKey: Buffer,
  _fileId: number,
  expiresValue: string,
  signature: string,
  nowSeconds: number = currentUnixTime(),
): boolean {
  if (!/^\d+$/.test(expiresValue) || !/^[a-f0-9]{64}$/.test(signature)) {
    return false;
  }

  const buffer = Buffer.from(signature, "hex");
  const expectedSignature = signDownload(_signingKey, _fileId, Number(expiresValue));

  if (!timingSafeEqual(buffer, Buffer.from(expectedSignature, "hex"))) {
    return false;
  }

  const expires = Number(expiresValue);
  if (!Number.isSafeInteger(expires) || expires <= nowSeconds) {
    return false;
  }

  return true;
}

function signDownload(
  _signingKey: Buffer,
  _fileId: number,
  _expires: number,
): string {
  const payload = `GET\n/files/${_fileId}/signed-download\nexpires=${_expires}`;
  return createHmac("sha256", _signingKey)
      .update(payload)
      .digest("hex");
}

function currentUnixTime(): number {
  return Math.floor(Date.now() / 1000);
}
