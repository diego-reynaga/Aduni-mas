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
    name = "persona",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_persona_documento", columnNames = "numero_documento"),
        @UniqueConstraint(name = "uk_persona_correo", columnNames = "correo_persona")
    }
)
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "tipo_persona", discriminatorType = DiscriminatorType.STRING, length = 30)
public class Persona extends BaseEntity {
    @Column(name = "nombre_persona", nullable = false, length = 100)
    private String nombres;

    @Column(name = "apellido_persona", nullable = false, length = 120)
    private String apellidos;

    @Builder.Default
    @Column(name = "tipo_documento", nullable = false, length = 20)
    private String tipoDocumento = "DNI";

    @Column(name = "numero_documento", nullable = false, length = 20)
    private String documentoIdentidad;

    @Column(name = "fech_naci_persona")
    private LocalDate fechaNacimiento;

    @Builder.Default
    @Column(name = "estado_persona", nullable = false)
    private Boolean estadoPersona = true;

    @Column(name = "genero_persona", length = 20)
    private String generoPersona;

    @Column(length = 150)
    private String direccion;

    @Column(length = 20)
    private String telefono;

    @Column(name = "correo_persona", length = 150)
    private String correo;
}
