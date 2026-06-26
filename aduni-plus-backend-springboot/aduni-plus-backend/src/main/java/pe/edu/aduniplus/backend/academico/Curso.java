package pe.edu.aduniplus.backend.academico;

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
    name = "curso",
    uniqueConstraints = @UniqueConstraint(name = "uk_curso_aula_asignatura", columnNames = {"aula_id", "asignatura_id"})
)
public class Curso extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "aula_id", nullable = false, foreignKey = @ForeignKey(name = "fk_curso_aula"))
    private Grado grado;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "asignatura_id", nullable = false, foreignKey = @ForeignKey(name = "fk_curso_asignatura"))
    private Materia materia;

    @Builder.Default
    @Column(nullable = false)
    private Boolean activo = true;
}
