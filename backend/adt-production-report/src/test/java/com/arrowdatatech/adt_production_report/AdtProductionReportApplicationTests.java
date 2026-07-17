package com.arrowdatatech.adt_production_report;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import com.arrowdatatech.adt_production_report.role.entity.Permission;
import com.arrowdatatech.adt_production_report.role.entity.UserPermission;
import com.arrowdatatech.adt_production_report.role.repository.PermissionRepository;
import com.arrowdatatech.adt_production_report.role.repository.UserPermissionRepository;
import com.arrowdatatech.adt_production_report.user.entity.User;
import com.arrowdatatech.adt_production_report.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class AdtProductionReportApplicationTests {

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private PermissionRepository permissionRepository;

	@Autowired
	private UserPermissionRepository userPermissionRepository;

	@Test
	void testUserPermissionQueriesAndDeletes() {
		// 1. Create a dummy user
		User user = User.builder()
				.email("test-user-perms@example.com")
				.userCode("TUP001")
				.passwordHash("hashed")
				.isActive(true)
				.updatedAt(OffsetDateTime.now())
				.build();
		user = userRepository.saveAndFlush(user);

		// 2. Create a dummy permission
		Permission perm = Permission.builder()
				.code("test_perm.view")
				.resource("test_perm")
				.action("view")
				.description("Test view permission")
				.isActive(true)
				.updatedAt(OffsetDateTime.now())
				.build();
		perm = permissionRepository.saveAndFlush(perm);

		// 3. Grant permission directly
		UserPermission up = UserPermission.builder()
				.user(user)
				.permission(perm)
				.build();
		userPermissionRepository.saveAndFlush(up);

		// 4. Verify findDirectPermissionCodesByUserId
		Set<String> directCodes = userPermissionRepository.findDirectPermissionCodesByUserId(user.getId());
		assertThat(directCodes).containsExactly("test_perm.view");

		// 5. Verify findPermissionCodesByUserId (UNION query)
		Set<String> allCodes = permissionRepository.findPermissionCodesByUserId(user.getId());
		assertThat(allCodes).contains("test_perm.view");

		// 6. Delete all direct permissions for user
		userPermissionRepository.deleteByUserId(user.getId());
		userPermissionRepository.flush();

		// 7. Verify they are gone
		Set<String> directCodesAfterDelete = userPermissionRepository.findDirectPermissionCodesByUserId(user.getId());
		assertThat(directCodesAfterDelete).isEmpty();
	}
}
