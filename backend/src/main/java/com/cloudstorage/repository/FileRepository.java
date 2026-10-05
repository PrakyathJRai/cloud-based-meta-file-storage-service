package com.cloudstorage.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.cloudstorage.entity.File;
import com.cloudstorage.entity.Folder;
import com.cloudstorage.entity.User;

public interface FileRepository extends JpaRepository<File, Long> {

    // =========================
    // Active files
    // =========================

    Page<File> findByOwnerAndFolderIsNullAndDeletedAtIsNull(
            User owner,
            Pageable pageable
    );

    Page<File> findByOwnerAndFolderAndDeletedAtIsNull(
            User owner,
            Folder folder,
            Pageable pageable
    );

    Optional<File> findByIdAndOwnerAndDeletedAtIsNull(
            Long id,
            User owner
    );

    List<File> findByOwnerAndDeletedAtIsNotNull(
            User owner
    );

    Optional<File> findByIdAndOwnerAndDeletedAtIsNotNull(
            Long id,
            User owner
    );

    // =========================
    // Search
    // =========================

    Page<File> findByOwnerAndNameContainingIgnoreCaseAndDeletedAtIsNull(
            User owner,
            String name,
            Pageable pageable
    );

    Page<File> findByOwnerAndContentTypeAndDeletedAtIsNull(
            User owner,
            String contentType,
            Pageable pageable
    );

    // =========================
    // Duplicate file checking
    // =========================

    boolean existsByNameAndOwnerAndFolderAndDeletedAtIsNull(
            String name,
            User owner,
            Folder folder
    );

    // =========================
    // ⭐ Starred files
    // =========================

    // Used by StarredFileService
    List<File> findByOwnerAndStarredTrueAndDeletedAtIsNull(
            User owner
    );

    // Used by FileService
    // Returns starred files ordered by latest update
    List<File> findByOwnerAndStarredTrueAndDeletedAtIsNullOrderByUpdatedAtDesc(
            User owner
    );
}