package com.cloudstorage.dto;

public class SignedDownloadResponse {

    private String signedURL;

    public SignedDownloadResponse() {
    }

    public String getSignedURL() {
        return signedURL;
    }

    public void setSignedURL(String signedURL) {
        this.signedURL = signedURL;
    }
}