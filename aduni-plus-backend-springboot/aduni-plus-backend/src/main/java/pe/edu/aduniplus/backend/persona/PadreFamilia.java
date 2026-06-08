package pe.edu.aduniplus.backend.persona;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(name = "padres_familia")
@PrimaryKeyJoinColumn(name = "persona_id", foreignKey = @ForeignKey(name = "fk_padres_familia_persona"))
@DiscriminatorValue("PADRE_FAMILIA")
public class PadreFamilia extends Persona {
    @Column(length = 100)
    private String ocupacion;

    @Builder.Default
    @Column(nullable = false)
    private Boolean activo = true;

    @OneToMany(mappedBy = "padreFamilia")
    @Builder.Default
    private Set<EstudianteApoderado> estudiantes = new HashSet<>();
}
