package com.cloudstorage.controller;

import com.cloudstorage.dto.FolderResponse;
import com.cloudstorage.dto.MoveFolderRequest;
import com.cloudstorage.dto.RenameFolderRequest;
import com.cloudstorage.entity.Folder;
import com.cloudstorage.service.FolderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/folders")
public class FolderController {

    private final FolderService folderService;

    public FolderController(FolderService folderService) {
        this.folderService = folderService;
    }

    @PostMapping
    public ResponseEntity<FolderResponse> createFolder(
            @RequestParam String name,
            @RequestParam(required = false) Long parentId,
            Authentication authentication
    ) {
        Folder folder = folderService.createFolder(
                authentication.getName(),
                name,
                parentId
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(FolderResponse.from(folder));
    }

    @GetMapping
    public ResponseEntity<List<FolderResponse>> getFolders(
            @RequestParam(required = false) Long parentId,
            Authentication authentication
    ) {
        List<FolderResponse> folders = folderService
                .getFolders(authentication.getName(), parentId)
                .stream()
                .map(FolderResponse::from)
                .toList();

        return ResponseEntity.ok(folders);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FolderResponse> renameFolder(
            @PathVariable Long id,
            @Valid @RequestBody RenameFolderRequest request,
            Authentication authentication
    ) {
        Folder folder = folderService.renameFolder(
                authentication.getName(),
                id,
                request.getName()
        );

        return ResponseEntity.ok(
                FolderResponse.from(folder)
        );
    }

    @PutMapping("/{id}/move")
    public ResponseEntity<FolderResponse> moveFolder(
            @PathVariable Long id,
            @Valid @RequestBody MoveFolderRequest request,
            Authentication authentication
    ) {
        Folder folder = folderService.moveFolder(
                authentication.getName(),
                id,
                request.getParentId()
        );

        return ResponseEntity.ok(
                FolderResponse.from(folder)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<FolderResponse> deleteFolder(
            @PathVariable Long id,
            Authentication authentication
    ) {
        Folder folder = folderService.deleteFolder(
                authentication.getName(),
                id
        );

        return ResponseEntity.ok(
                FolderResponse.from(folder)
        );
    }

    @GetMapping("/trash")
    public ResponseEntity<List<FolderResponse>> getTrash(
            Authentication authentication
    ) {
        List<FolderResponse> folders = folderService
                .getTrash(authentication.getName())
                .stream()
                .map(FolderResponse::from)
                .toList();

        return ResponseEntity.ok(folders);
    }

    @PutMapping("/{id}/restore")
    public ResponseEntity<FolderResponse> restoreFolder(
            @PathVariable Long id,
            Authentication authentication
    ) {
        Folder folder = folderService.restoreFolder(
                authentication.getName(),
                id
        );

        return ResponseEntity.ok(
                FolderResponse.from(folder)
        );
    }
}
