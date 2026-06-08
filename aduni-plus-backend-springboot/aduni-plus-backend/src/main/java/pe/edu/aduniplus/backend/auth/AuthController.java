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
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();

        return ResponseEntity.ok(new LoginResponse(
            jwtService.generateToken(user),
            user.getUsername(),
            user.roles()
        ));
    }

    @ExceptionHandler({BadCredentialsException.class, DisabledException.class})
    public ResponseEntity<Map<String, String>> handleAuthError() {
        return ResponseEntity.status(401).body(Map.of(
            "message", "Usuario o contrasena invalidos"
        ));
    }
}
