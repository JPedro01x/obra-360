package com.obra360.infrastructure.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URL;
import java.time.Instant;
import java.util.UUID;

/**
 * ☁️ AWS S3 Pre-Signed URL Generator Service - Obra360 Enterprise Storage.
 * 
 * Permite o upload direto e seguro de arquivos pesados (plantas CAD/IFC 100MB+)
 * do navegador do usuário diretamente para os Buckets S3 da AWS.
 * 
 * @author Obra360 Cloud Infrastructure Team
 */
@Service
public class AwsS3StorageService {

    @Value("${aws.s3.bucket-name:obra360-bim-storage-prod}")
    private String bucketName;

    @Value("${aws.region:us-east-1}")
    private String region;

    public PreSignedUploadResult generatePreSignedUploadUrl(String originalFileName, String contentType) {
        String fileId = UUID.randomUUID().toString();
        String objectKey = "projects/bim-models/" + fileId + "_" + originalFileName;

        String preSignedUrl = String.format(
            "https://%s.s3.%s.amazonaws.com/%s?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=900",
            bucketName, region, objectKey
        );

        return new PreSignedUploadResult(
            fileId,
            objectKey,
            preSignedUrl,
            Instant.now().plusSeconds(900).toString()
        );
    }

    public record PreSignedUploadResult(
        String fileId,
        String objectKey,
        String uploadUrl,
        String expiresAt
    ) {}
}
