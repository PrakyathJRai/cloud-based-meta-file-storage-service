package com.cloudstorage.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.cloudstorage.dto.CompleteUploadRequest;
import com.cloudstorage.dto.FileResponse;
import com.cloudstorage.dto.InitUploadRequest;
import com.cloudstorage.dto.InitUploadResponse;
import com.cloudstorage.entity.File;
import com.cloudstorage.service.FileService;
import com.cloudstorage.service.SupabaseStorageService;

@RestController
@RequestMapping("/api/files")
public class FileUploadController {

    private final SupabaseStorageService supabaseStorageService;
    private final FileService fileService;

    public FileUploadController(
            SupabaseStorageService supabaseStorageService,
            FileService fileService
    ) {
        this.supabaseStorageService = supabaseStorageService;
        this.fileService = fileService;
    }

    // =========================================================
    // 1. INITIALIZE SIGNED UPLOAD
    // =========================================================

    @PostMapping("/init-upload")
    public ResponseEntity<InitUploadResponse> initUpload(
            @RequestBody InitUploadRequest request,
            Authentication authentication
    ) {

        String email = authentication.getName();

        String storageKey =
                "users/"
                        + email
                        + "/"
                        + UUID.randomUUID()
                        + "-"
                        + request.getFileName();

        var uploadResponse =
                supabaseStorageService.createSignedUploadUrl(
                        storageKey
                );

        return ResponseEntity.ok(
                new InitUploadResponse(
                        storageKey,
                        uploadResponse.getUrl(),
                        uploadResponse.getToken()
                )
        );
    }

    // =========================================================
    // 2. DIRECT BACKEND FILE UPLOAD
    // =========================================================

    @PostMapping("/upload")
    public ResponseEntity<FileResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(
                    value = "folderId",
                    required = false
            ) Long folderId,
            Authentication authentication
    ) throws Exception {

        String email = authentication.getName();

        String originalName =
                file.getOriginalFilename();

        if (originalName == null || originalName.isBlank()) {
            throw new RuntimeException(
                    "File name is required"
            );
        }

        String storageKey =
                "users/"
                        + email
                        + "/"
                        + UUID.randomUUID()
                        + "-"
                        + originalName;

        String contentType =
                file.getContentType();

        if (contentType == null
                || contentType.isBlank()
                || contentType.equals(
                        "application/octet-stream"
                )) {

            contentType =
                    detectContentType(originalName);
        }

        // Upload file to Supabase Storage
        supabaseStorageService.uploadFile(
                storageKey,
                file.getBytes(),
                contentType
        );

        // Save metadata in PostgreSQL
        File savedFile =
                fileService.createFile(
                        email,
                        originalName,
                        originalName,
                        contentType,
                        file.getSize(),
                        storageKey,
                        folderId
                );

        return ResponseEntity.ok(
                FileResponse.from(savedFile)
        );
    }

    // =========================================================
    // 3. COMPLETE SIGNED UPLOAD
    // =========================================================

    @PostMapping("/complete-upload")
    public ResponseEntity<FileResponse> completeUpload(
            @RequestBody CompleteUploadRequest request,
            Authentication authentication
    ) {

        String email = authentication.getName();

        File savedFile =
                fileService.createFile(
                        email,
                        request.getName(),
                        request.getOriginalName(),
                        request.getContentType(),
                        request.getSize(),
                        request.getStorageKey(),
                        request.getFolderId()
                );

        return ResponseEntity.ok(
                FileResponse.from(savedFile)
        );
    }

@GetMapping("/{id}/download")
public ResponseEntity<String> downloadFile(
        @PathVariable Long id,
        Authentication authentication
) {

    String email = authentication.getName();

    File file = fileService.getAccessibleFile(email, id);

    System.out.println("DOWNLOAD USER: " + email);
    System.out.println("DOWNLOAD FILE ID: " + file.getId());
    System.out.println("DOWNLOAD STORAGE KEY: " + file.getStorageKey());

    String signedUrl =
            supabaseStorageService
                    .createSignedDownloadUrl(
                            file.getStorageKey(),
                            3600
                    );

    System.out.println("SIGNED URL CREATED SUCCESSFULLY");

    return ResponseEntity.ok(signedUrl);
}
    

    // =========================================================
    // 6. CONTENT TYPE DETECTION
    // =========================================================

    private String detectContentType(
            String fileName
    ) {

        String lowerCaseName =
                fileName.toLowerCase();

        if (lowerCaseName.endsWith(".pdf")) {
            return "application/pdf";
        }

        if (lowerCaseName.endsWith(".txt")) {
            return "text/plain";
        }

        if (lowerCaseName.endsWith(".jpg")
                || lowerCaseName.endsWith(".jpeg")) {

            return "image/jpeg";
        }

        if (lowerCaseName.endsWith(".png")) {
            return "image/png";
        }

        if (lowerCaseName.endsWith(".gif")) {
            return "image/gif";
        }

        if (lowerCaseName.endsWith(".json")) {
            return "application/json";
        }

        if (lowerCaseName.endsWith(".csv")) {
            return "text/csv";
        }

        return "application/octet-stream";
    }
}