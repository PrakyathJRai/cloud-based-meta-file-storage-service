package com.cloudstorage.dto;

public class CreatePublicShareLinkRequest {

    private String password;
    private Integer expiresInHours;

    public CreatePublicShareLinkRequest() {
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Integer getExpiresInHours() {
        return expiresInHours;
    }

    public void setExpiresInHours(Integer expiresInHours) {
        this.expiresInHours = expiresInHours;
    }
}