package com.cloudstorage.service;

import java.nio.charset.StandardCharsets;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriUtils;

import com.cloudstorage.config.SupabaseConfig;
import com.cloudstorage.dto.SignedDownloadResponse;
import com.cloudstorage.dto.SignedUploadResponse;

@Service
public class SupabaseStorageService {

    private final SupabaseConfig supabaseConfig;
    private final RestClient restClient;

    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public SupabaseStorageService(
            SupabaseConfig supabaseConfig
    ) {

        this.supabaseConfig = supabaseConfig;

        this.restClient = RestClient.builder()
                .baseUrl(supabaseConfig.getUrl())
                .defaultHeader(
                        "apikey",
                        supabaseConfig.getSecretKey()
                )
                .defaultHeader(
                        HttpHeaders.AUTHORIZATION,
                        "Bearer " + supabaseConfig.getSecretKey()
                )
                .build();
    }

    // =========================================================
    // ENCODE STORAGE PATH
    // =========================================================

    private String encodeStoragePath(
            String storageKey
    ) {

        if (storageKey == null
                || storageKey.isBlank()) {

            throw new IllegalArgumentException(
                    "Storage key is required"
            );
        }

        /*
         * IMPORTANT:
         *
         * encodePath() preserves "/" characters.
         *
         * Example:
         *
         * users/test@example.com/file name.pdf
         *
         * becomes:
         *
         * users/test@example.com/file%20name.pdf
         *
         * The folder separators remain intact.
         */

        return UriUtils.encodePath(
                storageKey,
                StandardCharsets.UTF_8
        );
    }

    // =========================================================
    // TEST SUPABASE CONNECTION
    // =========================================================

    public String testConnection() {

        restClient.get()
                .uri(
                        "/storage/v1/bucket/{bucket}",
                        supabaseConfig.getBucket()
                )
                .retrieve()
                .toBodilessEntity();

        return "Supabase Storage connection successful";
    }

    // =========================================================
    // UPLOAD FILE
    // =========================================================

    public void uploadFile(
            String storageKey,
            byte[] fileBytes,
            String contentType
    ) {

        String encodedPath =
                encodeStoragePath(storageKey);

        System.out.println(
                "SUPABASE UPLOAD STORAGE KEY: "
                        + storageKey
        );

        System.out.println(
                "SUPABASE UPLOAD ENCODED PATH: "
                        + encodedPath
        );

        try {

            restClient.post()
                    .uri(
                            "/storage/v1/object/"
                                    + supabaseConfig.getBucket()
                                    + "/"
                                    + encodedPath
                    )
                    .contentType(
                            MediaType.parseMediaType(
                                    contentType
                            )
                    )
                    .header(
                            "x-upsert",
                            "false"
                    )
                    .body(fileBytes)
                    .retrieve()
                    .toBodilessEntity();

            System.out.println(
                    "SUPABASE UPLOAD SUCCESS: "
                            + storageKey
            );

        } catch (HttpClientErrorException ex) {

            System.out.println(
                    "SUPABASE UPLOAD FAILED"
            );

            System.out.println(
                    "STATUS: "
                            + ex.getStatusCode()
            );

            System.out.println(
                    "RESPONSE: "
                            + ex.getResponseBodyAsString()
            );

            throw ex;
        }
    }

    // =========================================================
    // CREATE SIGNED UPLOAD URL
    // =========================================================

    public SignedUploadResponse createSignedUploadUrl(
            String storageKey
    ) {

        String encodedPath =
                encodeStoragePath(storageKey);

        String path =
                "/storage/v1/object/upload/sign/"
                        + supabaseConfig.getBucket()
                        + "/"
                        + encodedPath;

        System.out.println(
                "SUPABASE SIGNED UPLOAD PATH: "
                        + path
        );

        return restClient.post()
                .uri(path)
                .contentType(
                        MediaType.APPLICATION_JSON
                )
                .body("""
                        {
                          "upsert": false
                        }
                        """)
                .retrieve()
                .body(
                        SignedUploadResponse.class
                );
    }

    // =========================================================
    // CREATE SIGNED DOWNLOAD URL
    // =========================================================

    public String createSignedDownloadUrl(
            String storageKey,
            int expiresIn
    ) {

        String encodedPath =
                encodeStoragePath(storageKey);

        String path =
                "/storage/v1/object/sign/"
                        + supabaseConfig.getBucket()
                        + "/"
                        + encodedPath;

        System.out.println(
                "SUPABASE DOWNLOAD STORAGE KEY: "
                        + storageKey
        );

        System.out.println(
                "SUPABASE DOWNLOAD PATH: "
                        + path
        );

        try {

            SignedDownloadResponse response =
                    restClient.post()
                            .uri(path)
                            .contentType(
                                    MediaType.APPLICATION_JSON
                            )
                            .body("""
                                    {
                                      "expiresIn": %d
                                    }
                                    """.formatted(
                                            expiresIn
                                    ))
                            .retrieve()
                            .body(
                                    SignedDownloadResponse.class
                            );

            if (response == null
                    || response.getSignedURL() == null
                    || response.getSignedURL().isBlank()) {

                throw new RuntimeException(
                        "Supabase did not return a signed download URL"
                );
            }

            String signedUrl =
                    supabaseConfig.getUrl()
                            + "/storage/v1"
                            + response.getSignedURL();

            System.out.println(
                    "SUPABASE SIGNED DOWNLOAD URL CREATED"
            );

            return signedUrl;

        } catch (HttpClientErrorException ex) {

            System.out.println(
                    "SUPABASE SIGNED DOWNLOAD FAILED"
            );

            System.out.println(
                    "STATUS: "
                            + ex.getStatusCode()
            );

            System.out.println(
                    "RESPONSE: "
                            + ex.getResponseBodyAsString()
            );

            throw ex;
        }
    }

    // =========================================================
    // DELETE FILE FROM SUPABASE STORAGE
    // =========================================================

    public void deleteFile(
            String storageKey
    ) {

        String encodedPath =
                encodeStoragePath(storageKey);

        try {

            restClient.delete()
                    .uri(
                            "/storage/v1/object/"
                                    + supabaseConfig.getBucket()
                                    + "/"
                                    + encodedPath
                    )
                    .retrieve()
                    .toBodilessEntity();

            System.out.println(
                    "Supabase file deleted successfully: "
                            + storageKey
            );

        } catch (HttpClientErrorException ex) {

            String responseBody =
                    ex.getResponseBodyAsString();

            boolean objectAlreadyDeleted =
                    ex.getStatusCode().value() == 404
                            || responseBody.contains(
                                    "NoSuchKey"
                            )
                            || responseBody.contains(
                                    "Object not found"
                            );

            if (objectAlreadyDeleted) {

                System.out.println(
                        "Supabase object already deleted: "
                                + storageKey
                );

                return;
            }

            throw ex;
        }
    }
}