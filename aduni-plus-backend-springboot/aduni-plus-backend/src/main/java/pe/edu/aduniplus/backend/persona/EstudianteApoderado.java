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
    name = "estudiante_apoderados",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_estudiante_apoderado",
        columnNames = {"estudiante_id", "padre_familia_id"}
    )
)
public class EstudianteApoderado extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "estudiante_id", nullable = false, foreignKey = @ForeignKey(name = "fk_estudiante_apoderados_estudiante"))
    private Estudiante estudiante;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "padre_familia_id", nullable = false, foreignKey = @ForeignKey(name = "fk_estudiante_apoderados_padre"))
    private PadreFamilia padreFamilia;

    @Column(nullable = false, length = 40)
    private String parentesco;

    @Builder.Default
    @Column(nullable = false)
    private Boolean principal = false;
}
