package pe.edu.aduniplus.backend.academico;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import pe.edu.aduniplus.backend.common.BaseEntity;
import pe.edu.aduniplus.backend.notas.Evaluacion;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(
    name = "cursos",
    uniqueConstraints = @UniqueConstraint(name = "uk_cursos_grado_materia", columnNames = {"grado_id", "materia_id"})
)
public class Curso extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "grado_id", nullable = false, foreignKey = @ForeignKey(name = "fk_cursos_grado"))
    private Grado grado;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "materia_id", nullable = false, foreignKey = @ForeignKey(name = "fk_cursos_materia"))
    private Materia materia;

    @Builder.Default
    @Column(nullable = false)
    private Boolean activo = true;

    @OneToMany(mappedBy = "curso")
    @Builder.Default
    private Set<AsignacionDocente> asignacionesDocente = new HashSet<>();

    @OneToMany(mappedBy = "curso")
    @Builder.Default
    private Set<Evaluacion> evaluaciones = new HashSet<>();
}
