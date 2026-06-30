package pe.edu.aduniplus.backend.security;

import org.springframework.stereotype.Component;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class LoginRateLimiter {

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration BLOCK_DURATION = Duration.ofMinutes(15);

    private final Map<String, AtomicInteger> attempts = new ConcurrentHashMap<>();
    private final Map<String, Instant> blockedUntil = new ConcurrentHashMap<>();

    public boolean isBlocked(String key) {
        Instant blocked = blockedUntil.get(key);
        if (blocked != null) {
            if (Instant.now().isBefore(blocked)) {
                return true;
            }
            blockedUntil.remove(key);
            attempts.remove(key);
        }
        return false;
    }

    public void recordFailure(String key) {
        AtomicInteger count = attempts.computeIfAbsent(key, k -> new AtomicInteger(0));
        if (count.incrementAndGet() >= MAX_ATTEMPTS) {
            blockedUntil.put(key, Instant.now().plus(BLOCK_DURATION));
        }
    }

    public void reset(String key) {
        attempts.remove(key);
        blockedUntil.remove(key);
    }
}