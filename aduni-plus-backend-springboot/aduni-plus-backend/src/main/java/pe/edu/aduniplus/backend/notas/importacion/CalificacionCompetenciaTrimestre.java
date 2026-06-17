package pe.edu.aduniplus.backend.notas.importacion;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
import pe.edu.aduniplus.backend.academico.DetalleMatricula;
import pe.edu.aduniplus.backend.common.BaseEntity;
import pe.edu.aduniplus.backend.notas.ImportacionNotas;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(
    name = "calificacion_competencia_trimestre",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_calif_comp_tri_detalle_tri_comp",
        columnNames = {"detalle_matricula_id", "trimestre", "numero_competencia"}
    ),
    indexes = {
        @Index(name = "idx_calif_comp_tri_detalle", columnList = "detalle_matricula_id"),
        @Index(name = "idx_calif_comp_tri_importacion", columnList = "importacion_id")
    }
)
public class CalificacionCompetenciaTrimestre extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "detalle_matricula_id",
        nullable = false,
        foreignKey = @ForeignKey(name = "fk_calif_comp_tri_detallematricula")
    )
    private DetalleMatricula detalleMatricula;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PeriodoExcel trimestre;

    @Column(name = "numero_competencia", nullable = false)
    private Integer numeroCompetencia;

    @Column(nullable = false, length = 255)
    private String nombreCompetencia;

    @Column(precision = 5, scale = 2)
    private BigDecimal promedioCompetencia;

    @Column(length = 2)
    private String logroLiteral;

    @Column(nullable = false)
    private LocalDateTime fechaRegistro;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "importacion_id", foreignKey = @ForeignKey(name = "fk_calif_comp_tri_importacion"))
    private ImportacionNotas importacionNotas;

    @PrePersist
    @PreUpdate
    protected void updateFechaRegistro() {
        fechaRegistro = LocalDateTime.now();
    }
}
