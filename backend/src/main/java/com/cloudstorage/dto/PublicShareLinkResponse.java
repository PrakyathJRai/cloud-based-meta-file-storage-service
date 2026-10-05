package com.cloudstorage.dto;

import java.time.LocalDateTime;

import com.cloudstorage.entity.PublicShareLink;

public class PublicShareLinkResponse {

    private Long id;
    private Long fileId;
    private String token;
    private String publicUrl;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private boolean passwordProtected;

    public PublicShareLinkResponse() {
    }

    public PublicShareLinkResponse(
            Long id,
            Long fileId,
            String token,
            String publicUrl,
            LocalDateTime createdAt,
            LocalDateTime expiresAt,
            boolean passwordProtected
    ) {
        this.id = id;
        this.fileId = fileId;
        this.token = token;
        this.publicUrl = publicUrl;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
        this.passwordProtected = passwordProtected;
    }

    public static PublicShareLinkResponse from(
            PublicShareLink link,
            String publicUrl
    ) {

        return new PublicShareLinkResponse(
                link.getId(),
                link.getFile().getId(),
                link.getToken(),
                publicUrl,
                link.getCreatedAt(),
                link.getExpiresAt(),
                link.getPasswordHash() != null
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getFileId() {
        return fileId;
    }

    public void setFileId(Long fileId) {
        this.fileId = fileId;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getPublicUrl() {
        return publicUrl;
    }

    public void setPublicUrl(String publicUrl) {
        this.publicUrl = publicUrl;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public boolean isPasswordProtected() {
        return passwordProtected;
    }

    public void setPasswordProtected(boolean passwordProtected) {
        this.passwordProtected = passwordProtected;
    }
}