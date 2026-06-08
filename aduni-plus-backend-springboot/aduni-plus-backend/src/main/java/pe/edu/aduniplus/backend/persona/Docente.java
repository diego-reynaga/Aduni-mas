package pe.edu.aduniplus.backend.persona;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import pe.edu.aduniplus.backend.academico.AsignacionDocente;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(
    name = "docentes",
    uniqueConstraints = @UniqueConstraint(name = "uk_docentes_codigo", columnNames = "codigo_docente")
)
@PrimaryKeyJoinColumn(name = "persona_id", foreignKey = @ForeignKey(name = "fk_docentes_persona"))
@DiscriminatorValue("DOCENTE")
public class Docente extends Persona {
    @Column(name = "codigo_docente", nullable = false, length = 30)
    private String codigoDocente;

    @Column(length = 100)
    private String especialidad;

    @Column(name = "area_academica", length = 100)
    private String areaAcademica;

    @Builder.Default
    @Column(nullable = false)
    private Boolean activo = true;

    @OneToMany(mappedBy = "docente")
    @Builder.Default
    private Set<AsignacionDocente> asignaciones = new HashSet<>();
}
