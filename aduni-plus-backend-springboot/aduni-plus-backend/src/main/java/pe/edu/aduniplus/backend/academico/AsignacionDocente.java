package pe.edu.aduniplus.backend.academico;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import pe.edu.aduniplus.backend.common.BaseEntity;
import pe.edu.aduniplus.backend.persona.Docente;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(
    name = "asignaciones_docente",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_asignaciones_docente_curso_periodo",
        columnNames = {"docente_id", "curso_id", "periodo_academico_id"}
    ),
    indexes = {
        @Index(name = "idx_asignaciones_docente", columnList = "docente_id"),
        @Index(name = "idx_asignaciones_curso", columnList = "curso_id")
    }
)
public class AsignacionDocente extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "docente_id", nullable = false, foreignKey = @ForeignKey(name = "fk_asignaciones_docente"))
    private Docente docente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "curso_id", nullable = false, foreignKey = @ForeignKey(name = "fk_asignaciones_curso"))
    private Curso curso;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "periodo_academico_id", nullable = false, foreignKey = @ForeignKey(name = "fk_asignaciones_periodo"))
    private PeriodoAcademico periodoAcademico;

    private LocalDate fechaAsignacion;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false, length = 20)
    private EstadoAsignacionDocente estado = EstadoAsignacionDocente.ACTIVA;
}
