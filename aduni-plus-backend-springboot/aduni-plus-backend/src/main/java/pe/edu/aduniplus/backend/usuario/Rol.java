package pe.edu.aduniplus.backend.usuario;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import pe.edu.aduniplus.backend.common.BaseEntity;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(
    name = "rol",
    uniqueConstraints = @UniqueConstraint(name = "uk_rol_nombre", columnNames = "nombre")
)
public class Rol extends BaseEntity {
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RolNombre nombre;
}
