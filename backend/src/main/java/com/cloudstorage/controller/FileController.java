package com.cloudstorage.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cloudstorage.dto.FileResponse;
import com.cloudstorage.dto.PageResponse;
import com.cloudstorage.dto.UpdateFileRequest;
import com.cloudstorage.entity.File;
import com.cloudstorage.service.FileService;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    // =========================================================
    // CREATE FILE
    // =========================================================

    @PostMapping
    public ResponseEntity<FileResponse> createFile(
            @RequestParam String name,
            @RequestParam String originalName,
            @RequestParam String contentType,
            @RequestParam Long size,
            @RequestParam String storageKey,
            @RequestParam(required = false) Long folderId,
            Authentication authentication
    ) {

        File file = fileService.createFile(
                authentication.getName(),
                name,
                originalName,
                contentType,
                size,
                storageKey,
                folderId
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(FileResponse.from(file));
    }

    // =========================================================
    // GET FILES WITH PAGINATION
    // =========================================================

    @GetMapping
    public ResponseEntity<PageResponse<FileResponse>> getFiles(
            @RequestParam(required = false) Long folderId,
            Pageable pageable,
            Authentication authentication
    ) {

        Page<FileResponse> page = fileService
                .getFiles(
                        authentication.getName(),
                        folderId,
                        pageable
                )
                .map(FileResponse::from);

        PageResponse<FileResponse> response =
                new PageResponse<>(
                        page.getContent(),
                        page.getNumber(),
                        page.getSize(),
                        page.getTotalElements(),
                        page.getTotalPages(),
                        page.isFirst(),
                        page.isLast()
                );

        return ResponseEntity.ok(response);
    }

    // =========================================================
    // SEARCH FILES WITH PAGINATION
    // Supports:
    // 1. Search by file name
    // 2. Filter by content type
    // =========================================================

    @GetMapping("/search")
    public ResponseEntity<PageResponse<FileResponse>> searchFiles(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String contentType,
            Pageable pageable,
            Authentication authentication
    ) {

        Page<File> filePage;

        // Search by file name
        if (name != null && !name.isBlank()) {

            filePage = fileService.searchFiles(
                    authentication.getName(),
                    name,
                    pageable
            );

        }

        // Filter by content type
        else if (contentType != null && !contentType.isBlank()) {

            filePage = fileService.searchFilesByContentType(
                    authentication.getName(),
                    contentType,
                    pageable
            );

        }

        // Neither filter provided
        else {

            throw new RuntimeException(
                    "Either name or contentType is required"
            );
        }

        Page<FileResponse> page =
                filePage.map(FileResponse::from);

        PageResponse<FileResponse> response =
                new PageResponse<>(
                        page.getContent(),
                        page.getNumber(),
                        page.getSize(),
                        page.getTotalElements(),
                        page.getTotalPages(),
                        page.isFirst(),
                        page.isLast()
                );

        return ResponseEntity.ok(response);
    }

    // =========================================================
    // GET SINGLE FILE
    // =========================================================

    @GetMapping("/{id}")
    public ResponseEntity<FileResponse> getFile(
            @PathVariable Long id,
            Authentication authentication
    ) {

        File file = fileService.getFile(
                authentication.getName(),
                id
        );

        return ResponseEntity.ok(
                FileResponse.from(file)
        );
    }

    // =========================================================
    // RENAME FILE
    // =========================================================

    @PutMapping("/{fileId}")
    public ResponseEntity<FileResponse> renameFile(
            @PathVariable Long fileId,
            @RequestBody UpdateFileRequest request,
            Authentication authentication
    ) {

        File updatedFile =
                fileService.renameFile(
                        authentication.getName(),
                        fileId,
                        request.getName()
                );

        return ResponseEntity.ok(
                FileResponse.from(updatedFile)
        );
    }

    // =========================================================
    // DELETE FILE - MOVE TO TRASH
    // =========================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<FileResponse> deleteFile(
            @PathVariable Long id,
            Authentication authentication
    ) {

        File file = fileService.deleteFile(
                authentication.getName(),
                id
        );

        return ResponseEntity.ok(
                FileResponse.from(file)
        );
    }

    // =========================================================
    // PERMANENTLY DELETE FILE
    // =========================================================
    //
    // This removes:
    // 1. Actual file from Supabase Storage
    // 2. File metadata from PostgreSQL
    //
    // The file must already be in Trash.
    // =========================================================

    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<Void> permanentlyDeleteFile(
            @PathVariable Long id,
            Authentication authentication
    ) {

        fileService.permanentlyDeleteFile(
                authentication.getName(),
                id
        );

        return ResponseEntity.noContent().build();
    }

    // =========================================================
    // GET TRASH
    // =========================================================

    @GetMapping("/trash")
    public ResponseEntity<List<FileResponse>> getTrash(
            Authentication authentication
    ) {

        List<FileResponse> files = fileService
                .getTrash(authentication.getName())
                .stream()
                .map(FileResponse::from)
                .toList();

        return ResponseEntity.ok(files);
    }

    // =========================================================
    // RESTORE FILE
    // =========================================================

    @PutMapping("/{id}/restore")
    public ResponseEntity<FileResponse> restoreFile(
            @PathVariable Long id,
            Authentication authentication
    ) {

        File file = fileService.restoreFile(
                authentication.getName(),
                id
        );

        return ResponseEntity.ok(
                FileResponse.from(file)
        );
    }
}