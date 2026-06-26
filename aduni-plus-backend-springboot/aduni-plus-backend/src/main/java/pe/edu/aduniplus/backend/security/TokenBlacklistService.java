package pe.edu.aduniplus.backend.security;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Date;

@Service
@RequiredArgsConstructor
public class TokenBlacklistService {

    private final TokenBlacklistRepository tokenBlacklistRepository;
    private final JwtService jwtService;

    @Transactional
    public void invalidarToken(String token) {
        if (token == null || token.isBlank()) return;

        // Limpiamos el Bearer si lo tiene
        if (token.startsWith("Bearer ")) {
            token = token.substring(7).trim();
        }

        // Si ya está inválido no hacemos nada
        if (!jwtService.isValid(token)) return;

        // Extraer expiración real del token para saber cuándo borrarlo de la lista negra
        Date expirationDate = jwtService.extractExpiration(token);

        TokenBlacklist blacklist = TokenBlacklist.builder()
            .token(token)
            .fechaExpiracion(expirationDate.toInstant())
            .build();

        tokenBlacklistRepository.save(blacklist);
    }

    public boolean esTokenInvalido(String token) {
        return tokenBlacklistRepository.existsByToken(token);
    }

    // Se ejecuta a la medianoche todos los días para limpiar tokens que ya expiraron naturalmente
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void limpiarTokensExpirados() {
        tokenBlacklistRepository.deleteExpiredTokens(Instant.now());
    }
}
