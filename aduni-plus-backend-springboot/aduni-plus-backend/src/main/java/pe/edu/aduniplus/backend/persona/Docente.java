package pe.edu.aduniplus.backend.persona;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(
    name = "docente",
    uniqueConstraints = @UniqueConstraint(name = "uk_docente_codigo", columnNames = "codigo_docente")
)
@PrimaryKeyJoinColumn(name = "persona_id", foreignKey = @ForeignKey(name = "fk_docente_persona"))
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
}
