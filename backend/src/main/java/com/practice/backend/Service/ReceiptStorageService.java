package com.practice.backend.Service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
public class ReceiptStorageService {


    private final Path storagePath;

    private static final List<String> ALLOWED_CONTENT_TYPES = List.of(
            "image/jpeg",
            "image/png",
            "application/pdf"
    );

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

    public ReceiptStorageService(@Value("${app.storage.receipt-dir}") String receiptDir) {
        this.storagePath = Paths.get(receiptDir).toAbsolutePath().normalize();
        try {
            if(!Files.exists(storagePath)){
                Files.createDirectories(storagePath);
            }
        } catch (IOException e) {
            throw new RuntimeException("Could not create receipt storage directory.", e);
        }
    }

    public String store(MultipartFile file) {
        validateFile(file);
        String extension = StringUtils.getFilenameExtension(file.getOriginalFilename());
        if (extension == null || extension.isBlank()) {
            throw new IllegalArgumentException("File must have a valid extension.");
        }
        extension = extension.toLowerCase();
        String storageKey = UUID.randomUUID() + "." + extension;
        Path targetLocation = storagePath.resolve(storageKey).normalize();
        // Extra path traversal protection
        if (!targetLocation.startsWith(storagePath)) {
            throw new IllegalArgumentException("Invalid file path.");
        }
        try {
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return storageKey;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store receipt.", e);
        }
    }
    public Resource loadAsResource(String storageKey) {

        if (storageKey == null || storageKey.isBlank()) {
            throw new IllegalArgumentException("Invalid storage key.");
        }
        try {
            Path filePath = storagePath.resolve(storageKey).normalize();
            // Prevent ../ attacks
            if (!filePath.startsWith(storagePath)) {
                throw new IllegalArgumentException("Invalid storage key.");
            }
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new RuntimeException("Receipt not found.");
            }
            return resource;
        } catch (MalformedURLException e) {
            throw new RuntimeException("Invalid receipt path.", e);
        }
    }

    public void delete(String storageKey) {
        if (storageKey == null || storageKey.isBlank()) {
            return;
        }
        try {
            Path filePath = storagePath.resolve(storageKey).normalize();
            if (!filePath.startsWith(storagePath)) {
                throw new IllegalArgumentException("Invalid storage key.");
            }
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete receipt.", e);
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Receipt file cannot be empty.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Receipt file cannot exceed 5 MB.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Invalid file type. Only JPG, PNG and PDF are allowed.");
        }
    }
}