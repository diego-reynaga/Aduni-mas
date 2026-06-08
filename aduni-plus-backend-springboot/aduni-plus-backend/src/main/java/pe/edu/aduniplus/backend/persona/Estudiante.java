package pe.edu.aduniplus.backend.persona;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import pe.edu.aduniplus.backend.academico.Matricula;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(
    name = "estudiantes",
    uniqueConstraints = @UniqueConstraint(name = "uk_estudiantes_codigo", columnNames = "codigo_estudiante")
)
@PrimaryKeyJoinColumn(name = "persona_id", foreignKey = @ForeignKey(name = "fk_estudiantes_persona"))
@DiscriminatorValue("ESTUDIANTE")
public class Estudiante extends Persona {
    @Column(name = "codigo_estudiante", nullable = false, length = 30)
    private String codigoEstudiante;

    @Builder.Default
    @Column(nullable = false)
    private Boolean activo = true;

    @OneToMany(mappedBy = "estudiante")
    @Builder.Default
    private Set<Matricula> matriculas = new HashSet<>();

    @OneToMany(mappedBy = "estudiante")
    @Builder.Default
    private Set<EstudianteApoderado> apoderados = new HashSet<>();
}
