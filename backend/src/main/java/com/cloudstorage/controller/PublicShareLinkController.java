package com.cloudstorage.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cloudstorage.dto.CreatePublicShareLinkRequest;
import com.cloudstorage.dto.PublicShareLinkResponse;
import com.cloudstorage.entity.PublicShareLink;
import com.cloudstorage.service.PublicShareLinkService;

@RestController
@RequestMapping("/api/files")
public class PublicShareLinkController {

    private final PublicShareLinkService publicShareLinkService;

    public PublicShareLinkController(
            PublicShareLinkService publicShareLinkService
    ) {
        this.publicShareLinkService = publicShareLinkService;
    }

    // =========================================================
    // CREATE PUBLIC SHARE LINK
    // =========================================================

    @PostMapping("/{fileId}/public-links")
    public ResponseEntity<PublicShareLinkResponse> createPublicLink(
            @PathVariable Long fileId,
            @RequestBody CreatePublicShareLinkRequest request,
            Authentication authentication
    ) {

        PublicShareLink link =
                publicShareLinkService.createPublicLink(
                        authentication.getName(),
                        fileId,
                        request.getPassword(),
                        request.getExpiresInHours()
                );

        String publicUrl =
                "http://localhost:8080/api/public/files/"
                        + link.getToken();

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        PublicShareLinkResponse.from(
                                link,
                                publicUrl
                        )
                );
    }

    // =========================================================
    // GET PUBLIC LINKS FOR A FILE
    // =========================================================

    @GetMapping("/{fileId}/public-links")
    public ResponseEntity<List<PublicShareLinkResponse>> getPublicLinks(
            @PathVariable Long fileId,
            Authentication authentication
    ) {

        List<PublicShareLinkResponse> links =
                publicShareLinkService
                        .getFilePublicLinks(
                                authentication.getName(),
                                fileId
                        )
                        .stream()
                        .map(link ->
                                PublicShareLinkResponse.from(
                                        link,
                                        "http://localhost:8080/api/public/files/"
                                                + link.getToken()
                                )
                        )
                        .toList();

        return ResponseEntity.ok(links);
    }

    // =========================================================
    // DELETE PUBLIC SHARE LINK
    // =========================================================

    @DeleteMapping("/{fileId}/public-links/{linkId}")
    public ResponseEntity<Void> deletePublicLink(
            @PathVariable Long fileId,
            @PathVariable Long linkId,
            Authentication authentication
    ) {

        publicShareLinkService.deletePublicLink(
                authentication.getName(),
                fileId,
                linkId
        );

        return ResponseEntity.noContent().build();
    }
}