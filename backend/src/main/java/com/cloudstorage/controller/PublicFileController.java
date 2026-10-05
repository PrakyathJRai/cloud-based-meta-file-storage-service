package com.cloudstorage.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpClientErrorException;

import com.cloudstorage.entity.File;
import com.cloudstorage.entity.PublicShareLink;
import com.cloudstorage.service.PublicShareLinkService;
import com.cloudstorage.service.SupabaseStorageService;

@RestController
@RequestMapping("/api/public/files")
public class PublicFileController {

    private final PublicShareLinkService publicShareLinkService;
    private final SupabaseStorageService supabaseStorageService;

    public PublicFileController(
            PublicShareLinkService publicShareLinkService,
            SupabaseStorageService supabaseStorageService
    ) {
        this.publicShareLinkService = publicShareLinkService;
        this.supabaseStorageService = supabaseStorageService;
    }

    // =========================================================
    // ACCESS PUBLIC FILE
    // =========================================================

    @GetMapping("/{token}")
    public ResponseEntity<String> accessPublicFile(
            @PathVariable String token,
            @RequestParam(required = false) String password
    ) {

        System.out.println();
        System.out.println("==============================================");
        System.out.println("PUBLIC FILE REQUEST");
        System.out.println("==============================================");
        System.out.println("TOKEN: " + token);

        try {

            // -------------------------------------------------
            // 1. FIND PUBLIC SHARE LINK
            // -------------------------------------------------

            PublicShareLink link =
                    publicShareLinkService.getPublicLink(token);

            if (link == null) {

                System.out.println(
                        "PUBLIC SHARE LINK NOT FOUND"
                );

                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body("Public share link not found");
            }

            System.out.println(
                    "PUBLIC SHARE LINK FOUND"
            );

            System.out.println(
                    "PUBLIC LINK ID: "
                            + link.getId()
            );

            // -------------------------------------------------
            // 2. VERIFY PASSWORD
            // -------------------------------------------------

            boolean passwordValid =
                    publicShareLinkService.verifyPassword(
                            link,
                            password
                    );

            if (!passwordValid) {

                System.out.println(
                        "PUBLIC LINK PASSWORD INVALID"
                );

                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("Invalid password");
            }

            System.out.println(
                    "PUBLIC LINK PASSWORD VERIFIED"
            );

            // -------------------------------------------------
            // 3. GET FILE
            // -------------------------------------------------

            File file = link.getFile();

            if (file == null) {

                System.out.println(
                        "FILE ASSOCIATED WITH PUBLIC LINK NOT FOUND"
                );

                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body("File not found");
            }

            System.out.println(
                    "FILE ID: "
                            + file.getId()
            );

            System.out.println(
                    "FILE NAME: "
                            + file.getName()
            );

            System.out.println(
                    "ORIGINAL FILE NAME: "
                            + file.getOriginalName()
            );

            // -------------------------------------------------
            // 4. GET STORAGE KEY
            // -------------------------------------------------

            String storageKey =
                    file.getStorageKey();

            System.out.println(
                    "=============================================="
            );

            System.out.println(
                    "SUPABASE STORAGE KEY:"
            );

            System.out.println(
                    storageKey
            );

            System.out.println(
                    "=============================================="
            );

            if (storageKey == null
                    || storageKey.trim().isEmpty()) {

                System.out.println(
                        "STORAGE KEY IS EMPTY"
                );

                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(
                                "File storage key is missing"
                        );
            }

            // -------------------------------------------------
            // 5. CREATE SIGNED DOWNLOAD URL
            // -------------------------------------------------

            System.out.println(
                    "CREATING SUPABASE SIGNED DOWNLOAD URL..."
            );

            String signedUrl =
                    supabaseStorageService
                            .createSignedDownloadUrl(
                                    storageKey,
                                    3600
                            );

            System.out.println(
                    "SIGNED DOWNLOAD URL CREATED SUCCESSFULLY"
            );

            System.out.println(
                    "=============================================="
            );

            // -------------------------------------------------
            // 6. RETURN SIGNED URL
            // -------------------------------------------------

            return ResponseEntity.ok(signedUrl);

        } catch (HttpClientErrorException.NotFound e) {

            System.out.println();
            System.out.println(
                    "=============================================="
            );
            System.out.println(
                    "SUPABASE FILE NOT FOUND"
            );
            System.out.println(
                    "=============================================="
            );

            System.out.println(
                    "Supabase returned HTTP 404."
            );

            System.out.println(
                    "The database metadata exists, "
                            + "but the actual object does not exist "
                            + "in Supabase Storage."
            );

            System.out.println(
                    "=============================================="
            );

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(
                            "File exists in database but was not found in Supabase Storage"
                    );

        } catch (HttpClientErrorException e) {

            System.out.println();
            System.out.println(
                    "=============================================="
            );
            System.out.println(
                    "SUPABASE ERROR"
            );
            System.out.println(
                    "HTTP STATUS: "
                            + e.getStatusCode()
            );
            System.out.println(
                    "RESPONSE: "
                            + e.getResponseBodyAsString()
            );
            System.out.println(
                    "=============================================="
            );

            return ResponseEntity
                    .status(HttpStatus.BAD_GATEWAY)
                    .body(
                            "Supabase Storage error: "
                                    + e.getResponseBodyAsString()
                    );

        } catch (Exception e) {

            System.out.println();
            System.out.println(
                    "=============================================="
            );
            System.out.println(
                    "PUBLIC FILE ERROR"
            );
            System.out.println(
                    "ERROR TYPE: "
                            + e.getClass().getName()
            );
            System.out.println(
                    "ERROR MESSAGE: "
                            + e.getMessage()
            );
            System.out.println(
                    "=============================================="
            );

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(
                            "Unable to access public file"
                    );
        }
    }
}