package pe.edu.aduniplus.backend.notas;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Check;
import pe.edu.aduniplus.backend.academico.DetalleMatricula;
import pe.edu.aduniplus.backend.academico.PeriodoAcademico;
import pe.edu.aduniplus.backend.common.BaseEntity;
import pe.edu.aduniplus.backend.usuario.Usuario;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(
    name = "calificacion",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_calificacion_detalle_periodo_trimestre",
        columnNames = {"detalle_matricula_id", "periodo_academico_id", "trimestre"}
    ),
    indexes = {
        @Index(name = "idx_calificacion_detalle", columnList = "detalle_matricula_id"),
        @Index(name = "idx_calificacion_periodo", columnList = "periodo_academico_id")
    }
)
@Check(constraints = "valor_final >= 0 and valor_final <= 20")
public class Calificacion extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "detalle_matricula_id", nullable = false, foreignKey = @ForeignKey(name = "fk_calificacion_detallematricula"))
    private DetalleMatricula detalleMatricula;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "periodo_academico_id", nullable = false, foreignKey = @ForeignKey(name = "fk_calificacion_periodo"))
    private PeriodoAcademico periodoAcademico;

    @Column(nullable = false, length = 20)
    private String trimestre;

    @Column(name = "valor_final", nullable = false, precision = 5, scale = 2)
    private BigDecimal valorFinal;

    @Column(length = 2)
    private String logroLiteral;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registrado_por_id", foreignKey = @ForeignKey(name = "fk_calificacion_usuario"))
    private Usuario registradoPor;

    @Column(name = "importacion_id")
    private Long importacionId;

    @Column(nullable = false)
    private LocalDateTime fechaRegistro;

    @Column(length = 250)
    private String observacion;

    @PrePersist
    @PreUpdate
    protected void actualizarFechaRegistro() {
        fechaRegistro = LocalDateTime.now();
    }
}
