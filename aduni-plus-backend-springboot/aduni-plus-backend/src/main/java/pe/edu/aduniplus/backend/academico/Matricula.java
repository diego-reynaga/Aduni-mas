package pe.edu.aduniplus.backend.academico;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import pe.edu.aduniplus.backend.common.BaseEntity;
import pe.edu.aduniplus.backend.persona.Estudiante;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(
    name = "matricula",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_matricula_codigo", columnNames = "codigo_matricula"),
        @UniqueConstraint(name = "uk_matricula_estudiante_aula", columnNames = {"estudiante_id", "aula_id"})
    },
    indexes = @Index(name = "idx_matricula_estudiante", columnList = "estudiante_id")
)
public class Matricula extends BaseEntity {
    @Column(name = "codigo_matricula", nullable = false, length = 30)
    private String codigoMatricula;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "estudiante_id", nullable = false, foreignKey = @ForeignKey(name = "fk_matriculas_estudiante"))
    private Estudiante estudiante;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "aula_id", nullable = false, foreignKey = @ForeignKey(name = "fk_matricula_aula"))
    private Grado grado;

    @Column(nullable = false)
    private LocalDate fechaMatricula;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false, length = 20)
    private EstadoMatricula estado = EstadoMatricula.ACTIVA;
}
