package com.cloudstorage.dto;

import java.time.LocalDateTime;

import com.cloudstorage.entity.FileShare;
import com.cloudstorage.entity.SharePermission;

public class FileShareResponse {

    private Long id;

    private Long fileId;
    private String fileName;
    private String originalName;
    private String contentType;
    private Long size;

    private Long ownerId;
    private String ownerName;
    private String ownerEmail;

    private Long sharedWithId;
    private String sharedWithName;
    private String sharedWithEmail;

    private SharePermission permission;

    private LocalDateTime createdAt;

    public FileShareResponse() {
    }

    public static FileShareResponse from(FileShare fileShare) {

        FileShareResponse response = new FileShareResponse();

        response.id = fileShare.getId();

        // File information
        response.fileId = fileShare.getFile().getId();
        response.fileName = fileShare.getFile().getName();
        response.originalName = fileShare.getFile().getOriginalName();
        response.contentType = fileShare.getFile().getContentType();
        response.size = fileShare.getFile().getSize();

        // Owner information
        response.ownerId = fileShare.getFile().getOwner().getId();
        response.ownerName = fileShare.getFile().getOwner().getName();
        response.ownerEmail = fileShare.getFile().getOwner().getEmail();

        // Shared user information
        response.sharedWithId = fileShare.getSharedWith().getId();
        response.sharedWithName = fileShare.getSharedWith().getName();
        response.sharedWithEmail = fileShare.getSharedWith().getEmail();

        // Permission
        response.permission = fileShare.getPermission();

        // Share date
        response.createdAt = fileShare.getCreatedAt();

        return response;
    }

    public Long getId() {
        return id;
    }

    public Long getFileId() {
        return fileId;
    }

    public String getFileName() {
        return fileName;
    }

    public String getOriginalName() {
        return originalName;
    }

    public String getContentType() {
        return contentType;
    }

    public Long getSize() {
        return size;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public String getOwnerEmail() {
        return ownerEmail;
    }

    public Long getSharedWithId() {
        return sharedWithId;
    }

    public String getSharedWithName() {
        return sharedWithName;
    }

    public String getSharedWithEmail() {
        return sharedWithEmail;
    }

    public SharePermission getPermission() {
        return permission;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}