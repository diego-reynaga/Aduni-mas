package pe.edu.aduniplus.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import pe.edu.aduniplus.backend.usuario.UsuarioRepository;
import pe.edu.aduniplus.backend.usuario.Usuario;

@SpringBootApplication
@EnableJpaAuditing
public class AduniPlusBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(AduniPlusBackendApplication.class, args);
    }

    @Bean
    CommandLineRunner initAdmin(UsuarioRepository repo, PasswordEncoder encoder) {
        return args -> {
            repo.findByUsername("admin").ifPresent(admin -> {
                admin.setPassword(encoder.encode("admin123"));
                repo.save(admin);
            });
        };
    }
}
