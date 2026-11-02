import multer from "multer";

export function createUploadMiddleware(fieldName: string,maxBytes: number) {
  const upload = multer({
    limits: { fileSize: maxBytes },
  });
  return upload.single(fieldName);
}
