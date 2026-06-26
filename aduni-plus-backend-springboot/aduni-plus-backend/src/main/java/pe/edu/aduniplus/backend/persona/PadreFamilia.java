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
@Table(name = "apoderado")
@PrimaryKeyJoinColumn(name = "persona_id", foreignKey = @ForeignKey(name = "fk_apoderado_persona"))
@DiscriminatorValue("APODERADO")
public class PadreFamilia extends Persona {
    @Column(length = 100)
    private String ocupacion;

    @Builder.Default
    @Column(nullable = false)
    private Boolean activo = true;
}
