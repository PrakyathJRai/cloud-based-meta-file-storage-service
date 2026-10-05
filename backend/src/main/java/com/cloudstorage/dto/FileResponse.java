package com.cloudstorage.dto;

import java.time.LocalDateTime;

import com.cloudstorage.entity.File;

public class FileResponse {

    private final Long id;
    private final String name;
    private final String originalName;
    private final String contentType;
    private final Long size;
    private final Long ownerId;
    private final Long folderId;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
    private final LocalDateTime deletedAt;

    // ⭐ NEW
    private final boolean starred;

    public FileResponse(
            Long id,
            String name,
            String originalName,
            String contentType,
            Long size,
            Long ownerId,
            Long folderId,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            LocalDateTime deletedAt,
            boolean starred
    ) {
        this.id = id;
        this.name = name;
        this.originalName = originalName;
        this.contentType = contentType;
        this.size = size;
        this.ownerId = ownerId;
        this.folderId = folderId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.deletedAt = deletedAt;

        // ⭐ NEW
        this.starred = starred;
    }

    public static FileResponse from(File file) {

        return new FileResponse(
                file.getId(),
                file.getName(),
                file.getOriginalName(),
                file.getContentType(),
                file.getSize(),
                file.getOwner().getId(),
                file.getFolder() != null
                        ? file.getFolder().getId()
                        : null,
                file.getCreatedAt(),
                file.getUpdatedAt(),
                file.getDeletedAt(),

                // ⭐ NEW
                file.isStarred()
        );
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
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

    public Long getFolderId() {
        return folderId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public LocalDateTime getDeletedAt() {
        return deletedAt;
    }

    // ⭐ NEW
    public boolean isStarred() {
        return starred;
    }
}