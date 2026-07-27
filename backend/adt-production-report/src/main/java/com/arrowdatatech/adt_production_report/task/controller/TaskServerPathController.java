package com.arrowdatatech.adt_production_report.task.controller;

import com.arrowdatatech.adt_production_report.common.response.ApiResponse;
import com.arrowdatatech.adt_production_report.task.dto.ServerPathItemDto;
import com.arrowdatatech.adt_production_report.task.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/tasks/server-path")
@RequiredArgsConstructor
public class TaskServerPathController {

    private final TaskRepository taskRepository;

    /**
     * Lists directory contents of a validated server path.
     */
    @GetMapping("/list")
    public ResponseEntity<ApiResponse<List<ServerPathItemDto>>> listFiles(@RequestParam String path) {
        String cleanPath = cleanPathQuotes(path);
        if (!isPathAllowed(cleanPath)) {
            log.warn("Unauthorized attempt to list files at path: {}", path);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Access to the specified path is not allowed."));
        }

        File directory = new File(cleanPath);
        if (!directory.exists()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("The specified folder does not exist or is not accessible."));
        }

        if (!directory.isDirectory()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("The specified path is not a folder."));
        }

        File[] files = directory.listFiles();
        List<ServerPathItemDto> items = new ArrayList<>();
        if (files != null) {
            for (File f : files) {
                items.add(ServerPathItemDto.builder()
                        .name(f.getName())
                        .path(f.getAbsolutePath())
                        .isDirectory(f.isDirectory())
                        .sizeBytes(f.isDirectory() ? 0 : f.length())
                        .lastModified(f.lastModified())
                        .build());
            }
        }

        // Sort: directories first, then alphabetically (case-insensitive)
        items.sort((a, b) -> {
            if (a.isDirectory() != b.isDirectory()) {
                return a.isDirectory() ? -1 : 1;
            }
            return a.getName().compareToIgnoreCase(b.getName());
        });

        return ResponseEntity.ok(ApiResponse.success("Folder contents retrieved", items));
    }

    /**
     * Downloads a file from a validated server path.
     */
    @GetMapping("/download")
    public ResponseEntity<Resource> downloadFile(@RequestParam String path) {
        String cleanPath = cleanPathQuotes(path);
        if (!isPathAllowed(cleanPath)) {
            log.warn("Unauthorized attempt to download file at path: {}", path);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        File file = new File(cleanPath);
        if (!file.exists() || file.isDirectory()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        try {
            Resource resource = new FileSystemResource(file);
            String contentType = Files.probeContentType(file.toPath());
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                    .body(resource);
        } catch (IOException e) {
            log.error("Error reading file for download: {}", path, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Opens a file or folder locally on the host machine using the OS default tool.
     */
    @PostMapping("/open")
    public ResponseEntity<ApiResponse<Void>> openPathLocally(@RequestParam String path) {
        String cleanPath = cleanPathQuotes(path);
        if (!isPathAllowed(cleanPath)) {
            log.warn("Unauthorized attempt to open path locally: {}", path);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Access to the specified path is not allowed."));
        }

        File file = new File(cleanPath);
        if (!file.exists()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("The specified path does not exist."));
        }

        try {
            String os = System.getProperty("os.name").toLowerCase();
            if (os.contains("win")) {
                new ProcessBuilder("cmd.exe", "/c", "start", "\"\"", cleanPath).start();
                return ResponseEntity.ok(ApiResponse.success("Opened locally", null));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Local opening is only supported on Windows servers."));
            }
        } catch (IOException e) {
            log.error("Failed to open path locally: {}", path, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to open path locally: " + e.getMessage()));
        }
    }

    /**
     * Secures access by verifying the path is a registered server path or a subpath of it.
     */
    private boolean isPathAllowed(String requestedPath) {
        if (requestedPath == null || requestedPath.isBlank()) {
            return false;
        }

        // Clean quotes from target path
        String cleanRequested = cleanPathQuotes(requestedPath);

        // Normalize requested path separators to Windows backslashes
        String reqNormalized = cleanRequested.replace('/', '\\').trim();

        // Resolve path to make sure no traversal sequences (like ..) remain
        try {
            Path path = Paths.get(reqNormalized).normalize();
            reqNormalized = path.toString();
        } catch (Exception e) {
            return false;
        }

        // Fetch all unique server paths from database
        List<String> serverPaths = taskRepository.findAllServerPaths();
        for (String sp : serverPaths) {
            if (sp == null || sp.isBlank()) continue;
            String spNormalized = sp.replace('/', '\\').trim();
            try {
                spNormalized = Paths.get(spNormalized).normalize().toString();
            } catch (Exception ignored) {}

            // Check if exact match or if the requested path is a child item/subdirectory
            if (reqNormalized.equalsIgnoreCase(spNormalized) ||
                    reqNormalized.toLowerCase().startsWith(spNormalized.toLowerCase() + "\\")) {
                return true;
            }
        }
        return false;
    }

    /**
     * Helper to clean up any outer double or single quotes from paths.
     */
    private String cleanPathQuotes(String path) {
        if (path == null) {
            return null;
        }
        String trimmed = path.trim();
        if (trimmed.startsWith("\"") && trimmed.endsWith("\"")) {
            trimmed = trimmed.substring(1, trimmed.length() - 1);
        } else if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
            trimmed = trimmed.substring(1, trimmed.length() - 1);
        }
        return trimmed.trim();
    }
}
