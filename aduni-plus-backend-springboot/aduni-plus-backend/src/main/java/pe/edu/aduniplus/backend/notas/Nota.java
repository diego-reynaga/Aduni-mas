package pe.edu.aduniplus.backend.notas;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Check;
import pe.edu.aduniplus.backend.academico.AsignacionDocente;
import pe.edu.aduniplus.backend.common.BaseEntity;
import pe.edu.aduniplus.backend.persona.Estudiante;
import pe.edu.aduniplus.backend.usuario.Usuario;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(
    name = "nota",
    uniqueConstraints = @UniqueConstraint(name = "uk_nota_estudiante_evaluacion", columnNames = {"estudiante_id", "evaluacion_id"}),
    indexes = {
        @Index(name = "idx_nota_estudiante", columnList = "estudiante_id"),
        @Index(name = "idx_nota_evaluacion", columnList = "evaluacion_id")
    }
)
@Check(constraints = "valor >= 0 and valor <= 20")
public class Nota extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "estudiante_id", nullable = false, foreignKey = @ForeignKey(name = "fk_notas_estudiante"))
    private Estudiante estudiante;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "evaluacion_id", nullable = false, foreignKey = @ForeignKey(name = "fk_notas_evaluacion"))
    private Evaluacion evaluacion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "asignacion_docente_id", nullable = false, foreignKey = @ForeignKey(name = "fk_notas_asignacion_docente"))
    private AsignacionDocente asignacionDocente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "registrado_por_id", nullable = false, foreignKey = @ForeignKey(name = "fk_notas_usuario_registro"))
    private Usuario registradoPor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "importacion_id", foreignKey = @ForeignKey(name = "fk_nota_importacion"))
    private ImportacionNotas importacionNotas;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal valor;

    @Column(length = 250)
    private String observacion;
}
