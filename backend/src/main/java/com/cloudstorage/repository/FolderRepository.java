package com.cloudstorage.repository;

import com.cloudstorage.entity.Folder;
import com.cloudstorage.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FolderRepository extends JpaRepository<Folder, Long> {

    List<Folder> findByOwnerAndParentIsNullAndDeletedAtIsNull(User owner);

    List<Folder> findByOwnerAndParentAndDeletedAtIsNull(
            User owner,
            Folder parent
    );

    Optional<Folder> findByIdAndOwnerAndDeletedAtIsNull(
            Long id,
            User owner
    );

    List<Folder> findByOwnerAndDeletedAtIsNotNull(User owner);

    Optional<Folder> findByIdAndOwnerAndDeletedAtIsNotNull(
            Long id,
            User owner
    );

    boolean existsByNameAndOwnerAndParentAndDeletedAtIsNull(
            String name,
            User owner,
            Folder parent
    );
}
