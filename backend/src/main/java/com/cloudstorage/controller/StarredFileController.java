package com.cloudstorage.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cloudstorage.dto.FileResponse;
import com.cloudstorage.entity.File;
import com.cloudstorage.service.StarredFileService;

@RestController
@RequestMapping("/api/files")
public class StarredFileController {

    private final StarredFileService starredFileService;

    public StarredFileController(
            StarredFileService starredFileService) {

        this.starredFileService = starredFileService;
    }

    // =========================================================
    // ⭐ STAR FILE
    // =========================================================

    @PostMapping("/{fileId}/star")
    public ResponseEntity<FileResponse> starFile(
            @PathVariable Long fileId,
            Authentication authentication) {

        File file = starredFileService.starFile(
                authentication.getName(),
                fileId
        );

        return ResponseEntity.ok(
                FileResponse.from(file)
        );
    }

    // =========================================================
    // ☆ UNSTAR FILE
    // =========================================================

    @DeleteMapping("/{fileId}/star")
    public ResponseEntity<Void> unstarFile(
            @PathVariable Long fileId,
            Authentication authentication) {

        starredFileService.unstarFile(
                authentication.getName(),
                fileId
        );

        return ResponseEntity.noContent().build();
    }

    // =========================================================
    // ⭐ GET STARRED FILES
    // =========================================================

    @GetMapping("/starred")
    public ResponseEntity<List<FileResponse>> getStarredFiles(
            Authentication authentication) {

        List<File> files =
                starredFileService.getStarredFiles(
                        authentication.getName()
                );

        List<FileResponse> responses =
                files.stream()
                        .map(FileResponse::from)
                        .toList();

        return ResponseEntity.ok(responses);
    }
}