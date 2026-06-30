package pe.edu.aduniplus.backend;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class GenerateHashTest {
    @Test
    public void generate() {
        System.out.println("HASH_GENERATED_IS=" + new BCryptPasswordEncoder().encode("admin123"));
    }
}
