package com.arrowdatatech.adt_production_report.media.controller;

import com.arrowdatatech.adt_production_report.common.response.ApiResponse;
import com.arrowdatatech.adt_production_report.media.entity.MediaFile;
import com.arrowdatatech.adt_production_report.media.service.MediaService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/media")
@RequiredArgsConstructor
public class MediaController {

    private final MediaService mediaService;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "entityType", required = false) String entityType,
            @RequestParam(value = "entityId", required = false) UUID entityId) {

        MediaFile mediaFile = mediaService.uploadFile(file, entityType, entityId);

        Map<String, Object> response = Map.of(
                "id", mediaFile.getId(),
                "originalName", mediaFile.getOriginalName(),
                "mimeType", mediaFile.getMimeType(),
                "fileSize", mediaFile.getFileSize(),
                "url", "/media/" + mediaFile.getId()
        );

        return ResponseEntity.ok(ApiResponse.success("File uploaded successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resource> getFile(@PathVariable UUID id) {
        MediaFile mediaFile = mediaService.getMetadata(id);
        Resource fileResource = mediaService.loadFileAsResource(id);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(mediaFile.getMimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + mediaFile.getOriginalName() + "\"")
                .body(fileResource);
    }
}
