package com.arrowdatatech.adt_production_report.config;

import com.arrowdatatech.adt_production_report.role.entity.Role;
import com.arrowdatatech.adt_production_report.role.entity.UserRoleAssignment;
import com.arrowdatatech.adt_production_report.role.repository.RoleRepository;
import com.arrowdatatech.adt_production_report.role.repository.UserRoleAssignmentRepository;
import com.arrowdatatech.adt_production_report.user.entity.EmployeeProfile;
import com.arrowdatatech.adt_production_report.user.entity.EmployeeSalaryDetails;
import com.arrowdatatech.adt_production_report.user.entity.User;
import com.arrowdatatech.adt_production_report.user.repository.EmployeeProfileRepository;
import com.arrowdatatech.adt_production_report.user.repository.EmployeeSalaryRepository;
import com.arrowdatatech.adt_production_report.user.repository.UserRepository;
import com.arrowdatatech.adt_production_report.attendance.entity.AttendanceEmployee;
import com.arrowdatatech.adt_production_report.attendance.repository.AttendanceEmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final EmployeeProfileRepository profileRepository;
    private final EmployeeSalaryRepository salaryRepository;
    private final RoleRepository roleRepository;
    private final UserRoleAssignmentRepository roleAssignmentRepository;
    private final AttendanceEmployeeRepository attendanceEmployeeRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {

        // Step 1: Verify all roles exist from seed
        List<Role> allRoles = roleRepository.findAll();
        log.info("Roles in DB: {}",
                allRoles.stream().map(Role::getName).toList());

        if (allRoles.isEmpty()) {
            log.error("NO ROLES FOUND IN DB. " +
                    "Flyway seed V43__seed_data.sql may not have run.");
            return;
        }

        // Step 2: Create admin if not exists
        createDefaultAdminIfNotExists();

        // Step 3: Sync existing users to attendance employees
        syncExistingUsersToAttendanceEmployees();
    }

    private void createDefaultAdminIfNotExists() {

        // 1. Check if the email already exists to prevent duplicate crashes
        if (userRepository.existsByEmail("newadmin@arrowdatatech.com")) {
            log.info("Default admin email already exists - skipping creation.");
            return;
        }

        // 2. Check for the EXACT userCode you intend to create ("2", not "1")
        if (userRepository.existsByUserCode("2")) {
            log.info("Default admin exists - verifying role assignment...");

            // Verify role assignment exists
            userRepository.findByUserCodeAndDeletedAtIsNull("2")
                    .ifPresent(user -> {
                        List<String> roles = roleAssignmentRepository
                                .findRoleNamesByUserId(user.getId());
                        log.info("Admin user {} has roles: {}",
                                user.getEmail(), roles);

                        if (roles.isEmpty()) {
                            log.warn("Admin has no roles - fixing...");
                            assignAdminRole(user);
                        }
                    });
            return;
        }

        log.info("Creating default admin user...");

        // 1. Create user
        User admin = User.builder()
                .userCode("2") // Matches the check above
                .email("newadmin@arrowdatatech.com")
                .passwordHash(passwordEncoder.encode("Admin@123"))
                .isActive(true)
                .updatedAt(OffsetDateTime.now())
                .build();
        admin = userRepository.saveAndFlush(admin);
        log.info("Admin user created with id: {}", admin.getId());

        // 2. Create profile
        EmployeeProfile profile = EmployeeProfile.builder()
                .user(admin)
                .fullName("admin")
                .phone("+91 1234567890")
                .timezone("Asia/Kolkata")
                .isTopPerformer(false)
                .showCalendarStats(true)
                .updatedAt(OffsetDateTime.now())
                .build();
        profileRepository.saveAndFlush(profile);

        // 3. Create salary record
        EmployeeSalaryDetails salary = EmployeeSalaryDetails.builder()
                .user(admin)
                .salaryType("Monthly")
                .updatedAt(OffsetDateTime.now())
                .build();
        salaryRepository.saveAndFlush(salary);

        // 4. Assign Admin role
        assignAdminRole(admin);

        log.info("✅ Default admin created successfully");
        log.info("   Email:    newadmin@arrowdatatech.com");
        log.info("   Password: Admin@123");
        log.warn("   ⚠️  CHANGE PASSWORD AFTER FIRST LOGIN");
    }

    private void assignAdminRole(User user) {
        Role adminRole = roleRepository.findByName("Admin")
                .orElseThrow(() -> new RuntimeException(
                        "Admin role not found in DB"));

        boolean alreadyAssigned = roleAssignmentRepository
                .existsByUserIdAndRoleId(user.getId(), adminRole.getId());

        if (!alreadyAssigned) {
            UserRoleAssignment assignment = UserRoleAssignment.builder()
                    .user(user)
                    .role(adminRole)
                    .build();
            roleAssignmentRepository.saveAndFlush(assignment);
            log.info("Admin role assigned to user: {}", user.getEmail());
        } else {
            log.info("Admin role already assigned to: {}", user.getEmail());
        }
    }

    private void syncExistingUsersToAttendanceEmployees() {
        try {
            List<User> activeUsers = userRepository.findByIsActiveTrueAndDeletedAtIsNull();
            for (User u : activeUsers) {
                if (u.getEmployeeProfile() == null) continue;
                
                boolean exists = attendanceEmployeeRepository.findByUserId(u.getId()).isPresent();
                if (!exists) {
                    // Try to link by name
                    String fullName = u.getEmployeeProfile().getFullName().trim();
                    List<AttendanceEmployee> byName = attendanceEmployeeRepository.searchEmployees(null, fullName);
                    
                    AttendanceEmployee emp = null;
                    if (!byName.isEmpty()) {
                        for (AttendanceEmployee ae : byName) {
                            if (ae.getUserId() == null) {
                                emp = ae;
                                break;
                            }
                        }
                    }
                    
                    if (emp != null) {
                        emp.setUserId(u.getId());
                        emp.setUpdatedAt(OffsetDateTime.now());
                        attendanceEmployeeRepository.save(emp);
                        log.info("Linked existing AttendanceEmployee '{}' to userId {}", emp.getName(), u.getId());
                    } else {
                        // Create a new one
                        List<String> roles = roleAssignmentRepository.findRoleNamesByUserId(u.getId());
                        String roleName = roles.isEmpty() ? "Employee" : roles.get(0);
                        String category = "Employee";
                        if (List.of("Admin", "Employee", "Team Leader", "Manager", "Senior Operator", "Operator", "Coordinator")
                                .contains(roleName)) {
                            category = roleName;
                        }
                        
                        int sortOrder = (int) attendanceEmployeeRepository.count() + 1;
                        AttendanceEmployee newEmp = AttendanceEmployee.builder()
                                .userId(u.getId())
                                .name(fullName)
                                .category(category)
                                .isActive(true)
                                .sortOrder(sortOrder)
                                .baseSalary(new java.math.BigDecimal("5000.00"))
                                .updatedAt(OffsetDateTime.now())
                                .build();
                        attendanceEmployeeRepository.save(newEmp);
                        log.info("Created missing AttendanceEmployee '{}' for userId {}", newEmp.getName(), u.getId());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to sync existing users to attendance employees during initialization", e);
        }
    }
}