package com.cloudstorage.dto;

import jakarta.validation.constraints.NotNull;

public class MoveFolderRequest {

    @NotNull(message = "Parent folder ID is required")
    private Long parentId;

    public MoveFolderRequest() {
    }

    public Long getParentId() {
        return parentId;
    }

    public void setParentId(Long parentId) {
        this.parentId = parentId;
    }
}
