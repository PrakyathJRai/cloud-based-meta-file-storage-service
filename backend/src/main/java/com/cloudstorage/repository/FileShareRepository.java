package com.cloudstorage.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cloudstorage.entity.File;
import com.cloudstorage.entity.FileShare;
import com.cloudstorage.entity.User;

public interface FileShareRepository
        extends JpaRepository<FileShare, Long> {

    // Check whether a file is already shared with a user
    boolean existsByFileAndSharedWith(
            File file,
            User sharedWith
    );

    // Find a specific share
    Optional<FileShare> findByFileAndSharedWith(
            File file,
            User sharedWith
    );

    // Get all users a file has been shared with
    List<FileShare> findByFile(
            File file
    );

    // Get all files shared with a user
    List<FileShare> findBySharedWith(
            User sharedWith
    );

    // Remove a specific share
    void deleteByFileAndSharedWith(
            File file,
            User sharedWith
    );

    // Remove all shares associated with a file
    void deleteByFile(
            File file
    );
}