package pe.edu.aduniplus.backend.notas;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Check;
import pe.edu.aduniplus.backend.academico.Curso;
import pe.edu.aduniplus.backend.academico.PeriodoAcademico;
import pe.edu.aduniplus.backend.common.BaseEntity;
import pe.edu.aduniplus.backend.persona.Estudiante;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(
    name = "promedios_academicos",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_promedios_estudiante_curso_periodo",
        columnNames = {"estudiante_id", "curso_id", "periodo_academico_id"}
    ),
    indexes = @Index(name = "idx_promedios_estudiante", columnList = "estudiante_id")
)
@Check(constraints = "promedio >= 0 and promedio <= 20")
public class PromedioAcademico extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "estudiante_id", nullable = false, foreignKey = @ForeignKey(name = "fk_promedios_estudiante"))
    private Estudiante estudiante;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "curso_id", nullable = false, foreignKey = @ForeignKey(name = "fk_promedios_curso"))
    private Curso curso;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "periodo_academico_id", nullable = false, foreignKey = @ForeignKey(name = "fk_promedios_periodo"))
    private PeriodoAcademico periodoAcademico;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal promedio;

    @Builder.Default
    @Column(nullable = false)
    private Boolean publicado = false;

    @Column(nullable = false)
    private LocalDateTime calculadoEn;

    @PrePersist
    @PreUpdate
    protected void actualizarFechaCalculo() {
        calculadoEn = LocalDateTime.now();
    }
}
