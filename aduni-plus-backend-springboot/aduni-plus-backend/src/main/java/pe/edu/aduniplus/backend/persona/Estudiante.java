package pe.edu.aduniplus.backend.persona;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(
    name = "estudiante",
    uniqueConstraints = @UniqueConstraint(name = "uk_estudiante_codigo", columnNames = "codigo_estudiante")
)
@PrimaryKeyJoinColumn(name = "persona_id", foreignKey = @ForeignKey(name = "fk_estudiante_persona"))
@DiscriminatorValue("ESTUDIANTE")
public class Estudiante extends Persona {
    @Column(name = "codigo_estudiante", nullable = false, length = 30)
    private String codigoEstudiante;

    @Builder.Default
    @Column(nullable = false)
    private Boolean activo = true;
}
