package com.arrowdatatech.adt_production_report.media.service;

import com.arrowdatatech.adt_production_report.common.exception.BadRequestException;
import com.arrowdatatech.adt_production_report.common.exception.ResourceNotFoundException;
import com.arrowdatatech.adt_production_report.common.util.SecurityUtils;
import com.arrowdatatech.adt_production_report.media.entity.MediaFile;
import com.arrowdatatech.adt_production_report.media.repository.MediaFileRepository;
import com.arrowdatatech.adt_production_report.user.entity.User;
import com.arrowdatatech.adt_production_report.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MediaService {

    private final MediaFileRepository mediaFileRepository;
    private final UserRepository userRepository;

    private final Path rootDir = Paths.get("uploads").toAbsolutePath().normalize();

    @Transactional
    public MediaFile uploadFile(MultipartFile file, String entityType, UUID entityId) {
        if (file.isEmpty()) {
            throw new BadRequestException("Failed to store empty file.");
        }

        // Limit chat attachments to 10 MB (10 * 1024 * 1024 bytes)
        if ("chat".equalsIgnoreCase(entityType) && file.getSize() > 10 * 1024 * 1024) {
            throw new BadRequestException("Attachment exceeds the maximum size limit of 10 MB.");
        }

        try {
            // Ensure uploads directory exists
            if (!Files.exists(rootDir)) {
                Files.createDirectories(rootDir);
            }

            String originalName = file.getOriginalFilename();
            if (originalName == null || originalName.isBlank()) {
                originalName = "unnamed_file";
            }

            // Clean original filename to prevent path injection
            String cleanName = Paths.get(originalName).getFileName().toString();
            String extension = "";
            int dotIdx = cleanName.lastIndexOf('.');
            if (dotIdx > 0) {
                extension = cleanName.substring(dotIdx);
            }

            String storedName = UUID.randomUUID().toString() + extension;
            Path destinationFile = this.rootDir.resolve(Paths.get(storedName))
                    .normalize().toAbsolutePath();

            if (!destinationFile.getParent().equals(this.rootDir.toAbsolutePath())) {
                // Security check
                throw new BadRequestException("Cannot store file outside current directory.");
            }

            // Copy file to disk
            Files.copy(file.getInputStream(), destinationFile, StandardCopyOption.REPLACE_EXISTING);

            User currentUser = getCurrentUserOrNull();

            // Save metadata
            MediaFile mediaFile = MediaFile.builder()
                    .originalName(cleanName)
                    .storedName(storedName)
                    .mimeType(file.getContentType())
                    .fileSize(file.getSize())
                    .storagePath(destinationFile.toString())
                    .storageType("local")
                    .entityType(entityType)
                    .entityId(entityId)
                    .uploadedBy(currentUser)
                    .isActive(true)
                    .build();

            return mediaFileRepository.save(mediaFile);

        } catch (IOException e) {
            log.error("Failed to store file", e);
            throw new BadRequestException("Failed to store file: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public MediaFile getMetadata(UUID id) {
        return mediaFileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MediaFile", "id", id));
    }

    public Resource loadFileAsResource(UUID id) {
        MediaFile mediaFile = getMetadata(id);
        try {
            Path filePath = Paths.get(mediaFile.getStoragePath()).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() || resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("File", "path", mediaFile.getStoragePath());
            }
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("File", "id", id);
        }
    }

    private User getCurrentUserOrNull() {
        try {
            UUID uid = SecurityUtils.getCurrentUserId();
            return userRepository.findById(uid).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }
}
