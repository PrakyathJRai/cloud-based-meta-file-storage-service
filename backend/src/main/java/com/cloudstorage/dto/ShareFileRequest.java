package com.cloudstorage.dto;

import com.cloudstorage.entity.SharePermission;

public class ShareFileRequest {

    private String email;
    private SharePermission permission;

    public ShareFileRequest() {
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public SharePermission getPermission() {
        return permission;
    }

    public void setPermission(SharePermission permission) {
        this.permission = permission;
    }
}