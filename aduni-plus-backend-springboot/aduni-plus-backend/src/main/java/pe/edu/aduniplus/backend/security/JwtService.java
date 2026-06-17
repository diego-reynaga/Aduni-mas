package pe.edu.aduniplus.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pe.edu.aduniplus.backend.config.JwtProperties;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class JwtService {
    private final JwtProperties jwtProperties;

    public String generateToken(AuthenticatedUser user) {
        Instant now = Instant.now();
        Instant expiration = now.plusMillis(jwtProperties.expirationMs());

        return Jwts.builder()
            .subject(user.getUsername())
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiration))
            .claims(Map.of(
                "uid", user.userId(),
                "pid", user.personaId(),
                "roles", user.roles()
            ))
            .signWith(resolveKey())
            .compact();
    }

    public boolean isValid(String token) {
        try {
            extractAllClaims(token);
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    public Long extractUserId(String token) {
        Object value = extractAllClaims(token).get("uid");
        return value instanceof Number number ? number.longValue() : null;
    }

    @SuppressWarnings("unchecked")
    public List<String> extractRoles(String token) {
        Object value = extractAllClaims(token).get("roles");
        if (value instanceof List<?> roles) {
            return roles.stream().map(String::valueOf).toList();
        }
        return List.of();
    }

    public Date extractExpiration(String token) {
        return extractAllClaims(token).getExpiration();
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
            .verifyWith(resolveKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    private SecretKey resolveKey() {
        String secret = jwtProperties.secret() == null ? "" : jwtProperties.secret().trim();
        byte[] keyBytes;

        try {
            keyBytes = Decoders.BASE64.decode(secret);
            if (keyBytes.length < 32) {
                keyBytes = hashSecret(secret);
            }
        } catch (Exception ignored) {
            keyBytes = hashSecret(secret);
        }

        return Keys.hmacShaKeyFor(keyBytes);
    }

    private byte[] hashSecret(String secret) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return digest.digest(secret.getBytes(StandardCharsets.UTF_8));
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo generar clave JWT", ex);
        }
    }
}
