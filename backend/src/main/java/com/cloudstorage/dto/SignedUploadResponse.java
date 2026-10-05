package com.cloudstorage.dto;

public class SignedUploadResponse {

    private final String url;
    private final String token;

    public SignedUploadResponse(
            String url,
            String token
    ) {
        this.url = url;
        this.token = token;
    }

    public String getUrl() {
        return url;
    }

    public String getToken() {
        return token;
    }
}