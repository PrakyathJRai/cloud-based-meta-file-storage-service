package com.cloudstorage.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cloudstorage.service.SupabaseStorageService;

@RestController
@RequestMapping("/api/supabase")
public class SupabaseTestController {

    private final SupabaseStorageService supabaseStorageService;

    public SupabaseTestController(
            SupabaseStorageService supabaseStorageService) {
        this.supabaseStorageService = supabaseStorageService;
    }

    @GetMapping("/test")
    public ResponseEntity<String> testConnection() {

        return ResponseEntity.ok(
                supabaseStorageService.testConnection()
        );
    }

    @PostMapping("/signed-upload-test")
    public ResponseEntity<?> createSignedUploadUrl() {

        String storageKey = "test/signed-test.txt";

        var response =
                supabaseStorageService.createSignedUploadUrl(storageKey);

        return ResponseEntity.ok(response);
    }
}