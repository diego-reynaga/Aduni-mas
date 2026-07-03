package pe.edu.aduniplus.backend.security;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "tokens_invalidados")
public class TokenBlacklist {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 1024)
    private String token;

    @Column(name = "fecha_expiracion", nullable = false)
    private Instant fechaExpiracion;
}
