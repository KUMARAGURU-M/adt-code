package com.arrowdatatech.adt_production_report.user.controller;

import com.arrowdatatech.adt_production_report.common.audit.dto.PagedResponse;
import com.arrowdatatech.adt_production_report.common.response.ApiResponse;
import com.arrowdatatech.adt_production_report.user.dto.*;
import com.arrowdatatech.adt_production_report.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // GET /users - All users for User Management table
    @GetMapping
    @PreAuthorize("hasAnyRole('Admin','Manager','Team Leader')")
    public ResponseEntity<ApiResponse<List<UserListResponse>>> getAllUsers() {
        List<UserListResponse> users = userService.getAllUsers();
        return ResponseEntity.ok(
                ApiResponse.success("Users retrieved", users));
    }

    // GET /users/approvers - Fetch active Admins, Managers, and Team Leaders for leave approvers dropdown
    @GetMapping("/approvers")
    public ResponseEntity<ApiResponse<List<UserListResponse>>> getApprovers() {
        List<UserListResponse> approvers = userService.getApprovers();
        return ResponseEntity.ok(
                ApiResponse.success("Approvers retrieved", approvers));
    }

    // GET /users/search?q=&page=0&size=25
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('Admin','Manager')")
    public ResponseEntity<ApiResponse<PagedResponse<UserListResponse>>> searchUsers(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {

        Page<UserListResponse> result = userService.searchUsers(q, page, size);

        PagedResponse<UserListResponse> response = PagedResponse
                .<UserListResponse>builder()
                .content(result.getContent())
                .pageNumber(result.getNumber())
                .pageSize(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();

        return ResponseEntity.ok(ApiResponse.success("Search results", response));
    }

    // GET /users/{id} - User detail
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('Admin','Manager')")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(
            @PathVariable UUID id) {
        UserResponse user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success("User retrieved", user));
    }

    // POST /users - Create new user
    @PostMapping
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(
            @Valid @RequestBody CreateUserRequest request) {
        UserResponse created = userService.createUser(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("User created successfully", created));
    }

    // PUT /users/{id} - Update user
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('Admin','Manager')")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRequest request) {
        UserResponse updated = userService.updateUser(id, request);
        return ResponseEntity.ok(
                ApiResponse.success("User updated successfully", updated));
    }

    // DELETE /users/{id} - Soft delete user
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(
                ApiResponse.success("User deleted successfully", null));
    }

    // POST /users/{id}/set-password - Admin sets password for user
    @PostMapping("/{id}/set-password")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<ApiResponse<Void>> setPassword(
            @PathVariable UUID id,
            @Valid @RequestBody SetPasswordRequest request) {
        userService.setPassword(id, request);
        return ResponseEntity.ok(
                ApiResponse.success("Password updated successfully", null));
    }

    // POST /users/{id}/assign-role - Assign role to user
    @PostMapping("/{id}/assign-role")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<ApiResponse<Void>> assignRole(
            @PathVariable UUID id,
            @Valid @RequestBody AssignRoleRequest request) {
        userService.assignRole(id, request);
        return ResponseEntity.ok(
                ApiResponse.success("Role assigned successfully", null));
    }

    // POST /users/{id}/assign-projects - Assign projects and processes
    @PostMapping("/{id}/assign-projects")
    @PreAuthorize("hasAnyRole('Admin','Manager')")
    public ResponseEntity<ApiResponse<Void>> assignProjectsAndProcesses(
            @PathVariable UUID id,
            @Valid @RequestBody AssignProjectsRequest request) {
        userService.assignProjectsAndProcesses(id, request);
        return ResponseEntity.ok(
                ApiResponse.success("Projects and processes assigned", null));
    }

    // GET /users/{id}/assigned-projects - Get current assignments
    @GetMapping("/{id}/assigned-projects")
    @PreAuthorize("hasAnyRole('Admin','Manager')")
    public ResponseEntity<ApiResponse<AssignedProjectsResponse>> getAssignedProjects(
            @PathVariable UUID id) {
        AssignedProjectsResponse response =
                userService.getAssignedProjectsAndProcesses(id);
        return ResponseEntity.ok(
                ApiResponse.success("Assignments retrieved", response));
    }

    // GET /users/top-performers - For login page display
    @GetMapping("/top-performers")
    public ResponseEntity<ApiResponse<List<UserListResponse>>> getTopPerformers() {
        List<UserListResponse> performers = userService.getTopPerformers();
        return ResponseEntity.ok(
                ApiResponse.success("Top performers retrieved", performers));
    }

    // ─────────────────────────────────────────────
    // UPDATE LOGGED-IN USER PROFILE
    // ─────────────────────────────────────────────
//    @PutMapping("/me/profile")
//    public ResponseEntity<UserResponse> updateMyProfile(
//            @RequestBody UpdateProfileRequest request) {
//
//        // Notice we do NOT pass a userId from the URL path.
//        // The service layer extracts it securely from the JWT token.
//        UserResponse response = userService.updateMyProfile(request);
//
//        return ResponseEntity.ok(response);
//    }
}