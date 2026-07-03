package pe.edu.aduniplus.backend.persona;

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
    name = "apoderadoestudiante",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_apoderadoestudiante",
        columnNames = {"estudiante_id", "apoderado_id"}
    )
)
public class EstudianteApoderado extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "estudiante_id", nullable = false, foreignKey = @ForeignKey(name = "fk_apoderadoestudiante_estudiante"))
    private Estudiante estudiante;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "apoderado_id", nullable = false, foreignKey = @ForeignKey(name = "fk_apoderadoestudiante_apoderado"))
    private PadreFamilia padreFamilia;

    @Column(nullable = false, length = 40)
    private String parentesco;

    @Builder.Default
    @Column(name = "es_principal", nullable = false)
    private Boolean principal = false;

    @Builder.Default
    @Column(nullable = false)
    private Boolean estado = true;
}
