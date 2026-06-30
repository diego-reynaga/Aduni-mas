package pe.edu.aduniplus.backend.auth;

import java.util.List;

public record LoginResponse(
    String token,
    String refreshToken,
    String username,
    List<String> roles
) {}
