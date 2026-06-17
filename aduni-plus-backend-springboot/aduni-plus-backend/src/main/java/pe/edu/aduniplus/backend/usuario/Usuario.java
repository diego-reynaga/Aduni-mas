package pe.edu.aduniplus.backend.usuario;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import pe.edu.aduniplus.backend.common.BaseEntity;
import pe.edu.aduniplus.backend.persona.Persona;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(
    name = "usuario",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_usuario_username", columnNames = "username"),
        @UniqueConstraint(name = "uk_usuario_persona", columnNames = "persona_id")
    }
)
public class Usuario extends BaseEntity {
    @Column(nullable = false, length = 80)
    private String username;

    @Column(nullable = false)
    private String password;

    @Builder.Default
    @Column(nullable = false)
    private Boolean activo = true;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "persona_id",
        nullable = false,
        foreignKey = @ForeignKey(name = "fk_usuarios_persona")
    )
    private Persona persona;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "usuario_rol",
        joinColumns = @JoinColumn(name = "usuario_id", foreignKey = @ForeignKey(name = "fk_usuario_roles_usuario")),
        inverseJoinColumns = @JoinColumn(name = "rol_id", foreignKey = @ForeignKey(name = "fk_usuario_roles_rol")),
        uniqueConstraints = @UniqueConstraint(name = "uk_usuario_roles_usuario_rol", columnNames = {"usuario_id", "rol_id"})
    )
    @Builder.Default
    private Set<Rol> roles = new HashSet<>();
}
