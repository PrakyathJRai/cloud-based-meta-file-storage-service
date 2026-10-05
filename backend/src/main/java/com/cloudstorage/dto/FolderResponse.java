package com.cloudstorage.dto;

import com.cloudstorage.entity.Folder;

import java.time.LocalDateTime;

public class FolderResponse {

    private Long id;
    private String name;
    private Long ownerId;
    private Long parentId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public FolderResponse(
            Long id,
            String name,
            Long ownerId,
            Long parentId,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        this.id = id;
        this.name = name;
        this.ownerId = ownerId;
        this.parentId = parentId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static FolderResponse from(Folder folder) {
        return new FolderResponse(
                folder.getId(),
                folder.getName(),
                folder.getOwner().getId(),
                folder.getParent() != null
                        ? folder.getParent().getId()
                        : null,
                folder.getCreatedAt(),
                folder.getUpdatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public Long getParentId() {
        return parentId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
