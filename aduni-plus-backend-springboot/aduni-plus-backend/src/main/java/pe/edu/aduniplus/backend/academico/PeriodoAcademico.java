package pe.edu.aduniplus.backend.academico;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import pe.edu.aduniplus.backend.common.BaseEntity;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(
    name = "periodo_academico",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_periodo_gestion_nombre", columnNames = {"gestion_academica_id", "nombre"}),
        @UniqueConstraint(name = "uk_periodo_gestion_orden", columnNames = {"gestion_academica_id", "orden"})
    }
)
public class PeriodoAcademico extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "gestion_academica_id", nullable = false, foreignKey = @ForeignKey(name = "fk_periodos_gestion"))
    private GestionAcademica gestionAcademica;

    @Column(nullable = false, length = 80)
    private String nombre;

    @Column(nullable = false)
    private Integer orden;

    private LocalDate fechaInicio;

    private LocalDate fechaFin;

    @Builder.Default
    @Column(nullable = false)
    private Boolean cerrado = false;
}
