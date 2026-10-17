/**
 * ☁️ AWS S3 PRE-SIGNED UPLOAD CLIENT - FRONTEND
 */

export interface PreSignedUploadResponse {
  fileId: string;
  objectKey: string;
  uploadUrl: string;
  expiresAt: string;
}

/**
 * Solicita a URL pré-assinada do AWS S3 e realiza o upload seguro via HTTP PUT
 */
export async function uploadFileToAwsS3(file: File): Promise<PreSignedUploadResponse> {
  // Simula a obtenção da URL assinada do backend Spring Boot
  const response: PreSignedUploadResponse = {
    fileId: `S3-FILE-${Date.now()}`,
    objectKey: `projects/bim-models/${file.name}`,
    uploadUrl: `https://obra360-bim-storage-prod.s3.us-east-1.amazonaws.com/projects/bim-models/${file.name}`,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
  };

  // Simula o tempo de upload seguro para a AWS Cloud
  await new Promise((res) => setTimeout(res, 1200));

  return response;
}
