package pe.edu.aduniplus.backend.security;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.aduniplus.backend.usuario.Usuario;
import pe.edu.aduniplus.backend.usuario.UsuarioRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UsuarioRepository usuarioRepository;

    @Value("${app.jwt.refresh-expiration-ms:604800000}")
    private long refreshExpirationMs;

    @Transactional
    public RefreshToken crearRefreshToken(Long usuarioId) {
        refreshTokenRepository.revocarTodosPorUsuario(usuarioId);

        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        RefreshToken refreshToken = RefreshToken.builder()
            .usuario(usuario)
            .token(UUID.randomUUID().toString() + "-" + UUID.randomUUID().toString())
            .expiracion(LocalDateTime.now().plusSeconds(refreshExpirationMs / 1000))
            .revocado(false)
            .build();

        return refreshTokenRepository.save(refreshToken);
    }

    public Optional<RefreshToken> validarRefreshToken(String token) {
        return refreshTokenRepository.findByToken(token)
            .filter(rt -> !Boolean.TRUE.equals(rt.getRevocado()))
            .filter(rt -> rt.getExpiracion().isAfter(LocalDateTime.now()));
    }

    @Transactional
    public void revocarTodosPorUsuario(Long usuarioId) {
        refreshTokenRepository.revocarTodosPorUsuario(usuarioId);
    }
}