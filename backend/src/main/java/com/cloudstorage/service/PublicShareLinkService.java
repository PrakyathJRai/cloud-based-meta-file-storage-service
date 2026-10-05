package com.cloudstorage.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.cloudstorage.entity.File;
import com.cloudstorage.entity.PublicShareLink;
import com.cloudstorage.entity.User;
import com.cloudstorage.repository.FileRepository;
import com.cloudstorage.repository.PublicShareLinkRepository;
import com.cloudstorage.repository.UserRepository;

@Service
public class PublicShareLinkService {

    private final PublicShareLinkRepository publicShareLinkRepository;
    private final FileRepository fileRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public PublicShareLinkService(
            PublicShareLinkRepository publicShareLinkRepository,
            FileRepository fileRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.publicShareLinkRepository = publicShareLinkRepository;
        this.fileRepository = fileRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // =========================================================
    // CREATE PUBLIC SHARE LINK
    // =========================================================

    public PublicShareLink createPublicLink(
            String ownerEmail,
            Long fileId,
            String password,
            Integer expiresInHours
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

        // Expiry is required
        if (expiresInHours == null || expiresInHours <= 0) {
            throw new RuntimeException(
                    "Expiration time must be greater than 0 hours"
            );
        }

        LocalDateTime expiresAt =
                LocalDateTime.now()
                        .plusHours(expiresInHours);

        // Generate secure random token
        String token = UUID.randomUUID().toString();

        // Hash password if provided
        String passwordHash = null;

        if (password != null && !password.isBlank()) {

            passwordHash =
                    passwordEncoder.encode(password);
        }

        PublicShareLink publicShareLink =
                new PublicShareLink(
                        token,
                        file,
                        expiresAt,
                        passwordHash
                );

        return publicShareLinkRepository.save(
                publicShareLink
        );
    }

    // =========================================================
    // GET PUBLIC LINK
    // =========================================================

    public PublicShareLink getPublicLink(
            String token
    ) {

        PublicShareLink link =
                publicShareLinkRepository
                        .findByToken(token)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Public link not found"
                                )
                        );

        // Check expiry
        if (link.getExpiresAt() != null
                && link.getExpiresAt()
                        .isBefore(LocalDateTime.now())) {

            throw new RuntimeException(
                    "Public link has expired"
            );
        }

        // Do not allow public access to deleted files
        if (link.getFile().getDeletedAt() != null) {
            throw new RuntimeException(
                    "File is no longer available"
            );
        }

        return link;
    }

    // =========================================================
    // VERIFY PUBLIC LINK PASSWORD
    // =========================================================

    public boolean verifyPassword(
            PublicShareLink link,
            String password
    ) {

        // Link has no password
        if (link.getPasswordHash() == null) {
            return true;
        }

        if (password == null || password.isBlank()) {
            return false;
        }

        return passwordEncoder.matches(
                password,
                link.getPasswordHash()
        );
    }

    // =========================================================
    // GET PUBLIC LINKS FOR A FILE
    // =========================================================

    public List<PublicShareLink> getFilePublicLinks(
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

        return publicShareLinkRepository.findByFile(file);
    }

    // =========================================================
    // DELETE PUBLIC LINK
    // =========================================================

    public void deletePublicLink(
            String ownerEmail,
            Long fileId,
            Long linkId
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

        PublicShareLink link =
                publicShareLinkRepository
                        .findById(linkId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Public link not found"
                                )
                        );

        // Security check: link must belong to this file
        if (!link.getFile().getId().equals(file.getId())) {
            throw new RuntimeException(
                    "Public link does not belong to this file"
            );
        }

        publicShareLinkRepository.delete(link);
    }
}