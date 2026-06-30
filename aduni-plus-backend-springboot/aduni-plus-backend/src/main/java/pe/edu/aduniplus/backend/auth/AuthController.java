package pe.edu.aduniplus.backend.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.*;
import pe.edu.aduniplus.backend.auditoria.AuditoriaService;
import pe.edu.aduniplus.backend.security.AuthenticatedUser;
import pe.edu.aduniplus.backend.security.JwtService;
import pe.edu.aduniplus.backend.security.LoginRateLimiter;
import pe.edu.aduniplus.backend.security.RefreshToken;
import pe.edu.aduniplus.backend.security.RefreshTokenService;
import pe.edu.aduniplus.backend.usuario.Usuario;
import pe.edu.aduniplus.backend.usuario.UsuarioRepository;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final LoginRateLimiter loginRateLimiter;
    private final AuditoriaService auditoriaService;
    private final RefreshTokenService refreshTokenService;
    private final UsuarioRepository usuarioRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        String ip = obtenerIp(httpRequest);
        String key = request.username() + ":" + ip;

        if (loginRateLimiter.isBlocked(key)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
                "message", "Demasiados intentos. Cuenta bloqueada temporalmente por 15 minutos."
            ));
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
            );
            AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();

            loginRateLimiter.reset(key);

            String accessToken = jwtService.generateToken(user);
            RefreshToken newRefreshToken = refreshTokenService.crearRefreshToken(user.userId());

            auditoriaService.registrarAccion(
                user.getUsername(), "Inicio Sesion", "AuthController",
                null, ip, "Inicio de sesion exitoso"
            );

            return ResponseEntity.ok(new LoginResponse(
                accessToken,
                newRefreshToken.getToken(),
                user.getUsername(),
                user.roles()
            ));
        } catch (BadCredentialsException | DisabledException ex) {
            loginRateLimiter.recordFailure(key);

            usuarioRepository.findByUsername(request.username()).ifPresent(u ->
                auditoriaService.registrarAccion(
                    request.username(), "Intento Fallido", "AuthController",
                    u.getId(), ip, "Credenciales invalidas"
                )
            );

            return ResponseEntity.status(401).body(Map.of(
                "message", ex instanceof DisabledException
                    ? "Cuenta desactivada. Contacte al administrador."
                    : "Usuario o contrasena invalidos."
            ));
        }
    }

    @SuppressWarnings("unchecked")
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        var optional = refreshTokenService.validarRefreshToken(request.refreshToken());
        if (optional.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of(
                "message", "Refresh token invalido o expirado."
            ));
        }

        RefreshToken refreshToken = optional.get();
        Usuario usuario = refreshToken.getUsuario();

        if (!Boolean.TRUE.equals(usuario.getActivo())) {
            return ResponseEntity.status(401).body(Map.of(
                "message", "Cuenta desactivada."
            ));
        }

        AuthenticatedUser authUser = new AuthenticatedUser(
            usuario.getId(),
            usuario.getPersona().getId(),
            usuario.getUsername(),
            usuario.getPassword(),
            true,
            java.util.List.of(usuario.getRol().getNombre())
        );

        refreshTokenService.revocarTodosPorUsuario(usuario.getId());
        RefreshToken newRefreshToken = refreshTokenService.crearRefreshToken(usuario.getId());
        String newAccessToken = jwtService.generateToken(authUser);

        return ResponseEntity.ok(new LoginResponse(
            newAccessToken,
            newRefreshToken.getToken(),
            authUser.getUsername(),
            authUser.roles()
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) {
            AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
            refreshTokenService.revocarTodosPorUsuario(user.userId());
        }
        return ResponseEntity.ok(Map.of("message", "Sesion cerrada exitosamente."));
    }

    @ExceptionHandler({BadCredentialsException.class, DisabledException.class, Exception.class})
    public ResponseEntity<Map<String, String>> handleAuthError(Exception ex) {
        if (ex instanceof BadCredentialsException) {
            return ResponseEntity.status(401).body(Map.of("message", "Usuario o contrasena invalidos."));
        } else if (ex instanceof DisabledException) {
            return ResponseEntity.status(401).body(Map.of("message", "Cuenta desactivada."));
        }
        return ResponseEntity.status(500).body(Map.of(
            "message", "Error interno en el Login: " + ex.getMessage() + " | Clase: " + ex.getClass().getSimpleName()
        ));
    }

    private String obtenerIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank()) ip = request.getRemoteAddr();
        return ip;
    }
}
