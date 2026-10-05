package com.cloudstorage.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.cloudstorage.entity.File;
import com.cloudstorage.entity.User;
import com.cloudstorage.repository.FileRepository;
import com.cloudstorage.repository.UserRepository;

@Service
public class StarredFileService {

    private final FileRepository fileRepository;
    private final UserRepository userRepository;

    public StarredFileService(
            FileRepository fileRepository,
            UserRepository userRepository
    ) {
        this.fileRepository = fileRepository;
        this.userRepository = userRepository;
    }

    // ⭐ Star a file
    public File starFile(String email, Long fileId) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        File file = fileRepository
                .findByIdAndOwnerAndDeletedAtIsNull(fileId, user)
                .orElseThrow(() ->
                        new RuntimeException("File not found"));

        file.setStarred(true);

        return fileRepository.save(file);
    }

    // ⭐ Unstar a file
    public File unstarFile(String email, Long fileId) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        File file = fileRepository
                .findByIdAndOwnerAndDeletedAtIsNull(fileId, user)
                .orElseThrow(() ->
                        new RuntimeException("File not found"));

        file.setStarred(false);

        return fileRepository.save(file);
    }

    // ⭐ Get all starred files
    public List<File> getStarredFiles(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return fileRepository
                .findByOwnerAndStarredTrueAndDeletedAtIsNull(user);
    }
}