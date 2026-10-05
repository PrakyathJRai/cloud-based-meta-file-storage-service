package com.cloudstorage.dto;

public class InitUploadResponse {

    private final String storageKey;
    private final String uploadUrl;
    private final String token;

    public InitUploadResponse(
            String storageKey,
            String uploadUrl,
            String token
    ) {
        this.storageKey = storageKey;
        this.uploadUrl = uploadUrl;
        this.token = token;
    }

    public String getStorageKey() {
        return storageKey;
    }

    public String getUploadUrl() {
        return uploadUrl;
    }

    public String getToken() {
        return token;
    }
}