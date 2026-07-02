package pe.edu.aduniplus.backend;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RoleFlowIntegrationTest {
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @Test
    void authenticatesEveryRequiredRoleAndAuthorizesItsPortal() throws Exception {
        assertPortal("admin", "ADMINISTRADOR", "/api/portal/admin/dashboard");
        assertPortal("docente", "DOCENTE", "/api/portal/teacher/dashboard");
        assertPortal("estudiante", "ESTUDIANTE", "/api/portal/student");
        assertPortal("padre", "PADRE_FAMILIA", "/api/portal/family");
    }

    @Test
    void protectsAdministratorCrudEndpointsFromTeachers() throws Exception {
        String adminToken = login("admin", "ADMINISTRADOR");
        String teacherToken = login("docente", "DOCENTE");

        mockMvc.perform(get("/api/academico/asignaciones-docentes").contextPath("/api")
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/academico/asignaciones-docentes").contextPath("/api")
                .header("Authorization", "Bearer " + teacherToken))
            .andExpect(status().isForbidden());
    }

    private void assertPortal(String username, String expectedRole, String endpoint) throws Exception {
        String token = login(username, expectedRole);
        mockMvc.perform(get(endpoint).contextPath("/api")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk());
    }

    private String login(String username, String expectedRole) throws Exception {
        String json = mockMvc.perform(post("/api/auth/login").contextPath("/api")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new LoginBody(username, "Aduni1234!"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.roles[0]").value(expectedRole))
            .andReturn().getResponse().getContentAsString();
        JsonNode response = objectMapper.readTree(json);
        return response.path("token").asText();
    }

    private record LoginBody(String username, String password) {}
}
