package com.cloudstorage.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "file_shares",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_file_shared_with_user",
            columnNames = {"file_id", "shared_with_id"}
        )
    },
    indexes = {
        @Index(
            name = "idx_file_shares_file_id",
            columnList = "file_id"
        ),
        @Index(
            name = "idx_file_shares_shared_with_id",
            columnList = "shared_with_id"
        )
    }
)
public class FileShare {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "file_id", nullable = false)
    private File file;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shared_with_id", nullable = false)
    private User sharedWith;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SharePermission permission;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public FileShare() {
    }

    public FileShare(
            File file,
            User sharedWith,
            SharePermission permission
    ) {
        this.file = file;
        this.sharedWith = sharedWith;
        this.permission = permission;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public File getFile() {
        return file;
    }

    public void setFile(File file) {
        this.file = file;
    }

    public User getSharedWith() {
        return sharedWith;
    }

    public void setSharedWith(User sharedWith) {
        this.sharedWith = sharedWith;
    }

    public SharePermission getPermission() {
        return permission;
    }

    public void setPermission(SharePermission permission) {
        this.permission = permission;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}