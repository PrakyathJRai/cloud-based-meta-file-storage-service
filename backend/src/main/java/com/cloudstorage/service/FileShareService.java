package com.cloudstorage.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cloudstorage.dto.FileShareResponse;
import com.cloudstorage.entity.File;
import com.cloudstorage.entity.FileShare;
import com.cloudstorage.entity.SharePermission;
import com.cloudstorage.entity.User;
import com.cloudstorage.repository.FileRepository;
import com.cloudstorage.repository.FileShareRepository;
import com.cloudstorage.repository.UserRepository;

@Service
public class FileShareService {

    private final FileShareRepository fileShareRepository;
    private final FileRepository fileRepository;
    private final UserRepository userRepository;

    public FileShareService(
            FileShareRepository fileShareRepository,
            FileRepository fileRepository,
            UserRepository userRepository
    ) {
        this.fileShareRepository = fileShareRepository;
        this.fileRepository = fileRepository;
        this.userRepository = userRepository;
    }

    // =========================================================
    // SHARE FILE
    // =========================================================

    @Transactional
    public FileShareResponse shareFile(
            String ownerEmail,
            Long fileId,
            String sharedWithEmail,
            SharePermission permission
    ) {

        User owner = userRepository
                .findByEmail(ownerEmail)
                .orElseThrow(() ->
                        new RuntimeException("Owner not found")
                );

        File file = fileRepository
                .findByIdAndOwnerAndDeletedAtIsNull(
                        fileId,
                        owner
                )
                .orElseThrow(() ->
                        new RuntimeException("File not found")
                );

        User sharedWith = userRepository
                .findByEmail(sharedWithEmail)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User to share with not found"
                        )
                );

        if (owner.getId().equals(sharedWith.getId())) {
            throw new RuntimeException(
                    "You cannot share a file with yourself"
            );
        }

        if (permission == null) {
            throw new RuntimeException(
                    "Permission is required"
            );
        }

        if (fileShareRepository.existsByFileAndSharedWith(
                file,
                sharedWith
        )) {
            throw new RuntimeException(
                    "File is already shared with this user"
            );
        }

        FileShare fileShare = new FileShare(
                file,
                sharedWith,
                permission
        );

        FileShare savedShare =
                fileShareRepository.save(fileShare);

        return FileShareResponse.from(savedShare);
    }

    // =========================================================
    // GET USERS WHO HAVE ACCESS TO A FILE
    // =========================================================

    @Transactional(readOnly = true)
    public List<FileShareResponse> getFileShares(
            String ownerEmail,
            Long fileId
    ) {

        User owner = userRepository
                .findByEmail(ownerEmail)
                .orElseThrow(() ->
                        new RuntimeException("Owner not found")
                );

        File file = fileRepository
                .findByIdAndOwnerAndDeletedAtIsNull(
                        fileId,
                        owner
                )
                .orElseThrow(() ->
                        new RuntimeException("File not found")
                );

        return fileShareRepository
                .findByFile(file)
                .stream()
                .filter(fileShare ->
                        fileShare.getFile().getDeletedAt() == null
                )
                .map(FileShareResponse::from)
                .toList();
    }

    // =========================================================
    // GET FILES SHARED WITH CURRENT USER
    // =========================================================

    @Transactional(readOnly = true)
    public List<FileShareResponse> getSharedFiles(
            String email
    ) {

        User user = userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );

        return fileShareRepository
                .findBySharedWith(user)
                .stream()
                .filter(fileShare ->
                        fileShare.getFile().getDeletedAt() == null
                )
                .map(FileShareResponse::from)
                .toList();
    }

    // =========================================================
    // GET USER'S PERMISSION FOR A FILE
    // =========================================================

    @Transactional(readOnly = true)
    public SharePermission getPermission(
            String email,
            Long fileId
    ) {

        User user = userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );

        File file = fileRepository
                .findById(fileId)
                .orElseThrow(() ->
                        new RuntimeException("File not found")
                );

        if (file.getDeletedAt() != null) {
            throw new RuntimeException(
                    "File is in Trash"
            );
        }

        // File owner always has full edit permission
        if (file.getOwner().getId().equals(user.getId())) {
            return SharePermission.EDITOR;
        }

        // Check whether the file was shared with this user
        FileShare fileShare =
                fileShareRepository
                        .findByFileAndSharedWith(
                                file,
                                user
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "You do not have access to this file"
                                )
                        );

        return fileShare.getPermission();
    }

    // =========================================================
    // UPDATE FILE SHARE PERMISSION
    // =========================================================

    @Transactional
    public FileShareResponse updatePermission(
            String ownerEmail,
            Long fileId,
            Long shareId,
            SharePermission permission
    ) {

        User owner = userRepository
                .findByEmail(ownerEmail)
                .orElseThrow(() ->
                        new RuntimeException("Owner not found")
                );

        File file = fileRepository
                .findByIdAndOwnerAndDeletedAtIsNull(
                        fileId,
                        owner
                )
                .orElseThrow(() ->
                        new RuntimeException("File not found")
                );

        if (permission == null) {
            throw new RuntimeException(
                    "Permission is required"
            );
        }

        FileShare fileShare =
                fileShareRepository
                        .findById(shareId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Share not found"
                                )
                        );

        // Make sure the share belongs to this file
        if (!fileShare.getFile().getId().equals(file.getId())) {
            throw new RuntimeException(
                    "Share does not belong to this file"
            );
        }

        fileShare.setPermission(permission);

        FileShare updatedShare =
                fileShareRepository.save(fileShare);

        return FileShareResponse.from(updatedShare);
    }

    // =========================================================
    // REMOVE SHARE
    // =========================================================

    @Transactional
    public void removeShare(
            String ownerEmail,
            Long fileId,
            Long shareId
    ) {

        User owner = userRepository
                .findByEmail(ownerEmail)
                .orElseThrow(() ->
                        new RuntimeException("Owner not found")
                );

        File file = fileRepository
                .findByIdAndOwnerAndDeletedAtIsNull(
                        fileId,
                        owner
                )
                .orElseThrow(() ->
                        new RuntimeException("File not found")
                );

        FileShare fileShare =
                fileShareRepository
                        .findById(shareId)
                        .orElseThrow(() ->
                                new RuntimeException("Share not found")
                        );

        // Make sure the share belongs to this file
        if (!fileShare.getFile().getId().equals(file.getId())) {
            throw new RuntimeException(
                    "Share does not belong to this file"
            );
        }

        fileShareRepository.delete(fileShare);
    }
}