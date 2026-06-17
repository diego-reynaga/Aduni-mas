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
    name = "aula",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_aula_nivel_nombre_paralelo",
        columnNames = {"nivel_educativo_id", "nombre", "paralelo"}
    )
)
public class Grado extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "nivel_educativo_id", nullable = false, foreignKey = @ForeignKey(name = "fk_grados_nivel"))
    private NivelEducativo nivelEducativo;

    @Column(nullable = false, length = 80)
    private String nombre;

    @Column(nullable = false, length = 20)
    private String paralelo;

    @Builder.Default
    @Column(nullable = false)
    private Boolean activo = true;
}
