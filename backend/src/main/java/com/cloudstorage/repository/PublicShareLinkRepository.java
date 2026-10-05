package com.cloudstorage.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cloudstorage.entity.File;
import com.cloudstorage.entity.PublicShareLink;

public interface PublicShareLinkRepository
        extends JpaRepository<PublicShareLink, Long> {

    Optional<PublicShareLink> findByToken(String token);

    List<PublicShareLink> findByFile(File file);

    void deleteByFile(File file);
}