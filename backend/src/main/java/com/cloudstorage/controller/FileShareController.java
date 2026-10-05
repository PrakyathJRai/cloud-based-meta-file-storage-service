package com.cloudstorage.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cloudstorage.dto.FileShareResponse;
import com.cloudstorage.entity.SharePermission;
import com.cloudstorage.service.FileShareService;

@RestController
@RequestMapping("/api/shares")
public class FileShareController {

    private final FileShareService fileShareService;

    public FileShareController(FileShareService fileShareService) {
        this.fileShareService = fileShareService;
    }

    // =========================================================
    // SHARE FILE
    // =========================================================

    @PostMapping("/files/{fileId}")
    public ResponseEntity<FileShareResponse> shareFile(
            @PathVariable Long fileId,
            @RequestParam String sharedWithEmail,
            @RequestParam SharePermission permission,
            Authentication authentication
    ) {

        FileShareResponse response =
                fileShareService.shareFile(
                        authentication.getName(),
                        fileId,
                        sharedWithEmail,
                        permission
                );

        return ResponseEntity.ok(response);
    }

    // =========================================================
    // GET USERS WHO HAVE ACCESS TO A FILE
    // =========================================================

    @GetMapping("/files/{fileId}")
    public ResponseEntity<List<FileShareResponse>> getFileShares(
            @PathVariable Long fileId,
            Authentication authentication
    ) {

        List<FileShareResponse> shares =
                fileShareService.getFileShares(
                        authentication.getName(),
                        fileId
                );

        return ResponseEntity.ok(shares);
    }

    // =========================================================
    // GET FILES SHARED WITH CURRENT USER
    // =========================================================

    @GetMapping("/shared-with-me")
    public ResponseEntity<List<FileShareResponse>> getSharedFiles(
            Authentication authentication
    ) {

        List<FileShareResponse> shares =
                fileShareService.getSharedFiles(
                        authentication.getName()
                );

        return ResponseEntity.ok(shares);
    }

    // =========================================================
    // GET CURRENT USER'S PERMISSION
    // =========================================================

    @GetMapping("/files/{fileId}/permission")
    public ResponseEntity<SharePermission> getPermission(
            @PathVariable Long fileId,
            Authentication authentication
    ) {

        SharePermission permission =
                fileShareService.getPermission(
                        authentication.getName(),
                        fileId
                );

        return ResponseEntity.ok(permission);
    }

    // =========================================================
    // UPDATE PERMISSION
    // =========================================================

    @PutMapping("/files/{fileId}/{shareId}")
    public ResponseEntity<FileShareResponse> updatePermission(
            @PathVariable Long fileId,
            @PathVariable Long shareId,
            @RequestParam SharePermission permission,
            Authentication authentication
    ) {

        FileShareResponse response =
                fileShareService.updatePermission(
                        authentication.getName(),
                        fileId,
                        shareId,
                        permission
                );

        return ResponseEntity.ok(response);
    }

    // =========================================================
    // REMOVE SHARE
    // =========================================================

    @DeleteMapping("/files/{fileId}/{shareId}")
    public ResponseEntity<Void> removeShare(
            @PathVariable Long fileId,
            @PathVariable Long shareId,
            Authentication authentication
    ) {

        fileShareService.removeShare(
                authentication.getName(),
                fileId,
                shareId
        );

        return ResponseEntity.noContent().build();
    }
}