package pe.edu.aduniplus.backend.auth;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.*;
import pe.edu.aduniplus.backend.security.AuthenticatedUser;
import pe.edu.aduniplus.backend.security.JwtService;
import pe.edu.aduniplus.backend.auditoria.AuditoriaService;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final pe.edu.aduniplus.backend.security.TokenBlacklistService tokenBlacklistService;
    private final AuditoriaService auditoriaService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
            );
            AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();

            auditoriaService.registrarAuditoria("LOGIN_SUCCESS", "autenticacion", user.userId(), "Inicio de sesion exitoso - " + request.username());

            return ResponseEntity.ok(new LoginResponse(
                jwtService.generateToken(user),
                user.getUsername(),
                user.roles()
            ));
        } catch (org.springframework.security.core.AuthenticationException e) {
            auditoriaService.registrarAuditoria("LOGIN_FAIL", "autenticacion", null, "Intento fallido para usuario: " + request.username());
            throw e;
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            tokenBlacklistService.invalidarToken(token);
            try {
                String username = jwtService.extractUsername(token);
                auditoriaService.registrarAuditoria("LOGOUT", "autenticacion", null, "Cierre de sesion de: " + username);
            } catch (Exception e) {
                // Ignore if token is invalid or expired
            }
        }
        return ResponseEntity.ok(Map.of("message", "Sesion cerrada exitosamente"));
    }

    @ExceptionHandler({BadCredentialsException.class, DisabledException.class})
    public ResponseEntity<Map<String, String>> handleAuthError() {
        return ResponseEntity.status(401).body(Map.of(
            "message", "Usuario o contrasena invalidos"
        ));
    }
}
