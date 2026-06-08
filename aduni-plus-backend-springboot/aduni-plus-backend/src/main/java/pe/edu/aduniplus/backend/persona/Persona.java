package pe.edu.aduniplus.backend.persona;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import pe.edu.aduniplus.backend.common.BaseEntity;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(
    name = "personas",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_personas_documento", columnNames = "documento_identidad"),
        @UniqueConstraint(name = "uk_personas_correo", columnNames = "correo")
    }
)
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "tipo_persona", discriminatorType = DiscriminatorType.STRING, length = 30)
public class Persona extends BaseEntity {
    @Column(nullable = false, length = 100)
    private String nombres;

    @Column(nullable = false, length = 120)
    private String apellidos;

    @Column(nullable = false, length = 20)
    private String documentoIdentidad;

    private LocalDate fechaNacimiento;

    @Column(length = 150)
    private String direccion;

    @Column(length = 20)
    private String telefono;

    @Column(length = 150)
    private String correo;
}
