package com.cloudstorage.service;

import com.cloudstorage.entity.Folder;
import com.cloudstorage.entity.User;
import com.cloudstorage.repository.FolderRepository;
import com.cloudstorage.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class FolderService {

    private final FolderRepository folderRepository;
    private final UserRepository userRepository;

    public FolderService(
            FolderRepository folderRepository,
            UserRepository userRepository
    ) {
        this.folderRepository = folderRepository;
        this.userRepository = userRepository;
    }

    public Folder createFolder(
            String email,
            String name,
            Long parentId
    ) {
        User owner = getUserByEmail(email);

        String folderName = name.trim();

        if (folderName.isEmpty()) {
            throw new RuntimeException("Folder name is required");
        }

        Folder parent = null;

        if (parentId != null) {
            parent = folderRepository.findByIdAndOwnerAndDeletedAtIsNull(
                    parentId,
                    owner
            ).orElseThrow(() ->
                    new RuntimeException("Parent folder not found")
            );
        }

        if (folderRepository.existsByNameAndOwnerAndParentAndDeletedAtIsNull(
                folderName,
                owner,
                parent
        )) {
            throw new RuntimeException(
                    "A folder with this name already exists"
            );
        }

        Folder folder = new Folder(
                folderName,
                owner,
                parent
        );

        return folderRepository.save(folder);
    }

    public List<Folder> getFolders(
            String email,
            Long parentId
    ) {
        User owner = getUserByEmail(email);

        if (parentId == null) {
            return folderRepository
                    .findByOwnerAndParentIsNullAndDeletedAtIsNull(owner);
        }

        Folder parent = folderRepository
                .findByIdAndOwnerAndDeletedAtIsNull(parentId, owner)
                .orElseThrow(() ->
                        new RuntimeException("Parent folder not found")
                );

        return folderRepository
                .findByOwnerAndParentAndDeletedAtIsNull(owner, parent);
    }

    public Folder renameFolder(
            String email,
            Long folderId,
            String newName
    ) {
        User owner = getUserByEmail(email);

        String folderName = newName.trim();

        if (folderName.isEmpty()) {
            throw new RuntimeException("Folder name is required");
        }

        Folder folder = folderRepository
                .findByIdAndOwnerAndDeletedAtIsNull(folderId, owner)
                .orElseThrow(() ->
                        new RuntimeException("Folder not found")
                );

        if (folderRepository
                .existsByNameAndOwnerAndParentAndDeletedAtIsNull(
                        folderName,
                        owner,
                        folder.getParent()
                )
                && !folder.getName().equalsIgnoreCase(folderName)) {

            throw new RuntimeException(
                    "A folder with this name already exists"
            );
        }

        folder.setName(folderName);

        return folderRepository.save(folder);
    }

    public Folder moveFolder(
            String email,
            Long folderId,
            Long parentId
    ) {
        User owner = getUserByEmail(email);

        Folder folder = folderRepository
                .findByIdAndOwnerAndDeletedAtIsNull(folderId, owner)
                .orElseThrow(() ->
                        new RuntimeException("Folder not found")
                );

        if (folderId.equals(parentId)) {
            throw new RuntimeException(
                    "A folder cannot be moved into itself"
            );
        }

        Folder newParent = folderRepository
                .findByIdAndOwnerAndDeletedAtIsNull(parentId, owner)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Destination folder not found"
                        )
                );

        if (folderRepository
                .existsByNameAndOwnerAndParentAndDeletedAtIsNull(
                        folder.getName(),
                        owner,
                        newParent
                )) {

            throw new RuntimeException(
                    "A folder with this name already exists in the destination"
            );
        }

        folder.setParent(newParent);

        return folderRepository.save(folder);
    }

    public Folder deleteFolder(
            String email,
            Long folderId
    ) {
        User owner = getUserByEmail(email);

        Folder folder = folderRepository
                .findByIdAndOwnerAndDeletedAtIsNull(folderId, owner)
                .orElseThrow(() ->
                        new RuntimeException("Folder not found")
                );

        folder.setDeletedAt(LocalDateTime.now());

        return folderRepository.save(folder);
    }

    public List<Folder> getTrash(String email) {
        User owner = getUserByEmail(email);

        return folderRepository.findByOwnerAndDeletedAtIsNotNull(owner);
    }

    public Folder restoreFolder(
            String email,
            Long folderId
    ) {
        User owner = getUserByEmail(email);

        Folder folder = folderRepository
                .findByIdAndOwnerAndDeletedAtIsNotNull(
                        folderId,
                        owner
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "Folder not found in Trash"
                        )
                );

        Folder parent = folder.getParent();

        if (parent != null && parent.getDeletedAt() != null) {
            throw new RuntimeException(
                    "Cannot restore folder because its parent is in Trash"
            );
        }

        if (folderRepository
                .existsByNameAndOwnerAndParentAndDeletedAtIsNull(
                        folder.getName(),
                        owner,
                        parent
                )) {

            throw new RuntimeException(
                    "A folder with this name already exists"
            );
        }

        folder.setDeletedAt(null);

        return folderRepository.save(folder);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );
    }
}
