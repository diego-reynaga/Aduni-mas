package pe.edu.aduniplus.backend;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class HashGenTest {

    @Test
    public void generateHash() {
        System.out.println("HASH_START");
        System.out.println(new BCryptPasswordEncoder().encode("Aduni1234!"));
        System.out.println("HASH_END");
    }
}
