package com.cloudstorage.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.cloudstorage.entity.File;
import com.cloudstorage.entity.FileShare;
import com.cloudstorage.entity.Folder;
import com.cloudstorage.entity.SharePermission;
import com.cloudstorage.entity.User;
import com.cloudstorage.repository.FileRepository;
import com.cloudstorage.repository.FileShareRepository;
import com.cloudstorage.repository.FolderRepository;
import com.cloudstorage.repository.UserRepository;

@Service
public class FileService {

    private final FileRepository fileRepository;
    private final UserRepository userRepository;
    private final FolderRepository folderRepository;
    private final FileShareRepository fileShareRepository;
    private final SupabaseStorageService supabaseStorageService;

    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public FileService(
            FileRepository fileRepository,
            UserRepository userRepository,
            FolderRepository folderRepository,
            FileShareRepository fileShareRepository,
            SupabaseStorageService supabaseStorageService) {

        this.fileRepository = fileRepository;
        this.userRepository = userRepository;
        this.folderRepository = folderRepository;
        this.fileShareRepository = fileShareRepository;
        this.supabaseStorageService = supabaseStorageService;
    }

    // =========================================================
    // CREATE FILE
    // =========================================================

    public File createFile(
            String email,
            String name,
            String originalName,
            String contentType,
            Long size,
            String storageKey,
            Long folderId) {

        User owner = getUserByEmail(email);

        String fileName = name.trim();

        if (fileName.isEmpty()) {
            throw new RuntimeException(
                    "File name is required"
            );
        }

        if (size == null || size < 0) {
            throw new RuntimeException(
                    "Invalid file size"
            );
        }

        if (storageKey == null
                || storageKey.trim().isEmpty()) {

            throw new RuntimeException(
                    "Storage key is required"
            );
        }

        Folder folder = null;

        // ---------------------------------------------------------
        // Find parent folder
        // ---------------------------------------------------------

        if (folderId != null) {

            folder = folderRepository
                    .findByIdAndOwnerAndDeletedAtIsNull(
                            folderId,
                            owner
                    )
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Folder not found"
                            )
                    );
        }

        // ---------------------------------------------------------
        // Prevent duplicate active file names
        // ---------------------------------------------------------

        if (fileRepository
                .existsByNameAndOwnerAndFolderAndDeletedAtIsNull(
                        fileName,
                        owner,
                        folder
                )) {

            throw new RuntimeException(
                    "A file with this name already exists"
            );
        }

        // ---------------------------------------------------------
        // Create file metadata
        // ---------------------------------------------------------

        File file = new File(
                fileName,
                originalName,
                contentType,
                size,
                storageKey,
                owner,
                folder
        );

        // ⭐ New files are not starred by default
        file.setStarred(false);

        return fileRepository.save(file);
    }

    // =========================================================
    // GET FILES BY FOLDER WITH PAGINATION
    // =========================================================

    public Page<File> getFiles(
            String email,
            Long folderId,
            Pageable pageable) {

        User owner = getUserByEmail(email);

        // ---------------------------------------------------------
        // Root directory
        // ---------------------------------------------------------

        if (folderId == null) {

            return fileRepository
                    .findByOwnerAndFolderIsNullAndDeletedAtIsNull(
                            owner,
                            pageable
                    );
        }

        // ---------------------------------------------------------
        // Specific folder
        // ---------------------------------------------------------

        Folder folder = folderRepository
                .findByIdAndOwnerAndDeletedAtIsNull(
                        folderId,
                        owner
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "Folder not found"
                        )
                );

        return fileRepository
                .findByOwnerAndFolderAndDeletedAtIsNull(
                        owner,
                        folder,
                        pageable
                );
    }

    // =========================================================
    // GET SINGLE FILE
    // =========================================================

    public File getFile(
            String email,
            Long fileId) {

        User owner = getUserByEmail(email);

        return fileRepository
                .findByIdAndOwnerAndDeletedAtIsNull(
                        fileId,
                        owner
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "File not found"
                        )
                );
    }

    // =========================================================
    // GET FILE THAT USER CAN ACCESS
    // =========================================================

    public File getAccessibleFile(
            String email,
            Long fileId) {

        User user = getUserByEmail(email);

        // ---------------------------------------------------------
        // Check if user owns the file
        // ---------------------------------------------------------

        var ownedFile =
                fileRepository
                        .findByIdAndOwnerAndDeletedAtIsNull(
                                fileId,
                                user
                        );

        if (ownedFile.isPresent()) {
            return ownedFile.get();
        }

        // ---------------------------------------------------------
        // Otherwise check whether file was shared
        // ---------------------------------------------------------

        File file = fileRepository
                .findById(fileId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "File not found"
                        )
                );

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

        File sharedFile = fileShare.getFile();

        // ---------------------------------------------------------
        // Do not allow access to deleted files
        // ---------------------------------------------------------

        if (sharedFile.getDeletedAt() != null) {

            throw new RuntimeException(
                    "File not found"
            );
        }

        return sharedFile;
    }

    // =========================================================
    // RENAME FILE
    // =========================================================

    public File renameFile(
            String email,
            Long fileId,
            String newName) {

        if (newName == null
                || newName.isBlank()) {

            throw new RuntimeException(
                    "File name is required"
            );
        }

        User user = getUserByEmail(email);

        File file = getAccessibleFile(
                email,
                fileId
        );

        // ---------------------------------------------------------
        // Owner has full edit permission
        // ---------------------------------------------------------

        if (file.getOwner()
                .getId()
                .equals(user.getId())) {

            file.setName(
                    newName.trim()
            );

            return fileRepository.save(file);
        }

        // ---------------------------------------------------------
        // Check shared user's permission
        // ---------------------------------------------------------

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

        // ---------------------------------------------------------
        // Viewer cannot rename
        // ---------------------------------------------------------

        if (fileShare.getPermission()
                != SharePermission.EDITOR) {

            throw new RuntimeException(
                    "You have VIEWER permission and cannot modify this file"
            );
        }

        // ---------------------------------------------------------
        // Editor can rename
        // ---------------------------------------------------------

        file.setName(
                newName.trim()
        );

        return fileRepository.save(file);
    }

    // =========================================================
    // DELETE FILE - SOFT DELETE
    // =========================================================

    public File deleteFile(
            String email,
            Long fileId) {

        User owner = getUserByEmail(email);

        File file = fileRepository
                .findByIdAndOwnerAndDeletedAtIsNull(
                        fileId,
                        owner
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "File not found"
                        )
                );

        // Mark file as deleted
        file.setDeletedAt(
                LocalDateTime.now()
        );

        return fileRepository.save(file);
    }

    // =========================================================
    // GET TRASH
    // =========================================================

    public List<File> getTrash(
            String email) {

        User owner = getUserByEmail(email);

        return fileRepository
                .findByOwnerAndDeletedAtIsNotNull(
                        owner
                );
    }

    // =========================================================
    // RESTORE FILE
    // =========================================================

    public File restoreFile(
            String email,
            Long fileId) {

        User owner = getUserByEmail(email);

        File file = fileRepository
                .findByIdAndOwnerAndDeletedAtIsNotNull(
                        fileId,
                        owner
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "File not found in Trash"
                        )
                );

        Folder folder = file.getFolder();

        // ---------------------------------------------------------
        // Parent folder must not be in Trash
        // ---------------------------------------------------------

        if (folder != null
                && folder.getDeletedAt() != null) {

            throw new RuntimeException(
                    "Cannot restore file because its folder is in Trash"
            );
        }

        // ---------------------------------------------------------
        // Prevent duplicate active file names
        // ---------------------------------------------------------

        if (fileRepository
                .existsByNameAndOwnerAndFolderAndDeletedAtIsNull(
                        file.getName(),
                        owner,
                        folder
                )) {

            throw new RuntimeException(
                    "A file with this name already exists"
            );
        }

        // ---------------------------------------------------------
        // Restore file
        // ---------------------------------------------------------

        file.setDeletedAt(null);

        return fileRepository.save(file);
    }

    // =========================================================
    // PERMANENTLY DELETE FILE
    // =========================================================

    public void permanentlyDeleteFile(
            String email,
            Long fileId) {

        User owner = getUserByEmail(email);

        // ---------------------------------------------------------
        // Find file in Trash
        // ---------------------------------------------------------

        File file = fileRepository
                .findByIdAndOwnerAndDeletedAtIsNotNull(
                        fileId,
                        owner
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "File not found in Trash"
                        )
                );

        // ---------------------------------------------------------
        // STEP 1:
        // Delete all file sharing records
        // ---------------------------------------------------------
        //
        // PostgreSQL will not allow the file record to be
        // deleted while file_shares still references it.
        //

        fileShareRepository.deleteByFile(file);

        // ---------------------------------------------------------
        // STEP 2:
        // Delete actual object from Supabase Storage
        // ---------------------------------------------------------
        //
        // If the object was already deleted during a previous
        // attempt, SupabaseStorageService safely handles the
        // "Object not found" response.
        //

        supabaseStorageService.deleteFile(
                file.getStorageKey()
        );

        // ---------------------------------------------------------
        // STEP 3:
        // Delete file metadata from PostgreSQL
        // ---------------------------------------------------------

        fileRepository.delete(file);
    }

    // =========================================================
    // SEARCH FILES WITH PAGINATION
    // =========================================================

    public Page<File> searchFiles(
            String email,
            String name,
            Pageable pageable) {

        User owner = getUserByEmail(email);

        if (name == null
                || name.trim().isEmpty()) {

            throw new RuntimeException(
                    "Search name is required"
            );
        }

        return fileRepository
                .findByOwnerAndNameContainingIgnoreCaseAndDeletedAtIsNull(
                        owner,
                        name.trim(),
                        pageable
                );
    }

    // =========================================================
    // SEARCH FILES BY CONTENT TYPE WITH PAGINATION
    // =========================================================

    public Page<File> searchFilesByContentType(
            String email,
            String contentType,
            Pageable pageable) {

        User owner = getUserByEmail(email);

        if (contentType == null
                || contentType.isBlank()) {

            throw new RuntimeException(
                    "Content type is required"
            );
        }

        return fileRepository
                .findByOwnerAndContentTypeAndDeletedAtIsNull(
                        owner,
                        contentType.trim(),
                        pageable
                );
    }

    // =========================================================
    // ⭐ STAR FILE
    // Only the OWNER can star a file
    // =========================================================

    public File starFile(
            String email,
            Long fileId) {

        User owner = getUserByEmail(email);

        File file = fileRepository
                .findByIdAndOwnerAndDeletedAtIsNull(
                        fileId,
                        owner
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "File not found"
                        )
                );

        file.setStarred(true);

        return fileRepository.save(file);
    }

    // =========================================================
    // ☆ UNSTAR FILE
    // Only the OWNER can unstar a file
    // =========================================================

    public File unstarFile(
            String email,
            Long fileId) {

        User owner = getUserByEmail(email);

        File file = fileRepository
                .findByIdAndOwnerAndDeletedAtIsNull(
                        fileId,
                        owner
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "File not found"
                        )
                );

        file.setStarred(false);

        return fileRepository.save(file);
    }

    // =========================================================
    // ⭐ GET STARRED FILES
    // Only active files are returned
    // =========================================================

    public List<File> getStarredFiles(
            String email) {

        User owner = getUserByEmail(email);

        return fileRepository
                .findByOwnerAndStarredTrueAndDeletedAtIsNullOrderByUpdatedAtDesc(
                        owner
                );
    }

    // =========================================================
    // FIND USER BY EMAIL
    // =========================================================

    private User getUserByEmail(
            String email) {

        return userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found"
                        )
                );
    }
}