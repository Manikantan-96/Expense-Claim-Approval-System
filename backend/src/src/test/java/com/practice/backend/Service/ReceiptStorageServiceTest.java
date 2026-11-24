package com.practice.backend.Service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

public class ReceiptStorageServiceTest {

    private ReceiptStorageService receiptStorageService;

    // JUnit 5 injects a temporary, isolated directory for this test class
    @TempDir
    Path tempStorageDir;

    @BeforeEach
    void setUp() {
        // Initialize the service using the safe temporary directory
        receiptStorageService = new ReceiptStorageService(tempStorageDir.toString());
    }

    @Test
    void store_WithInvalidContentType_ShouldThrowException() {
        // Arrange: Simulate uploading a text file instead of an image/PDF
        MultipartFile invalidFile = new MockMultipartFile(
                "file",
                "script.txt",
                "text/plain",
                "malicious script".getBytes()
        );

        // Act & Assert
        assertThatThrownBy(() -> receiptStorageService.store(invalidFile))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Only JPG, PNG and PDF are allowed");
    }

    @Test
    void store_WithOversizedFile_ShouldThrowException() {
        // Arrange: Create a dummy byte array that is exactly 6 MB
        byte[] largeContent = new byte[6 * 1024 * 1024];
        MultipartFile oversizedFile = new MockMultipartFile(
                "file",
                "huge.pdf",
                "application/pdf",
                largeContent
        );

        // Act & Assert
        assertThatThrownBy(() -> receiptStorageService.store(oversizedFile))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("cannot exceed 5 MB");
    }

    @Test
    void loadAsResource_WithPathTraversalAttempt_ShouldThrowException() {
        // Arrange: Simulate a hacker trying to break out of the storage directory
        String maliciousKey = "../../../etc/passwd";

        // Act & Assert
        assertThatThrownBy(() -> receiptStorageService.loadAsResource(maliciousKey))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid storage key");
    }
}