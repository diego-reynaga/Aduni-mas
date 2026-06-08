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
    name = "administrativos",
    uniqueConstraints = @UniqueConstraint(name = "uk_administrativos_codigo", columnNames = "codigo_administrativo")
)
@PrimaryKeyJoinColumn(name = "persona_id", foreignKey = @ForeignKey(name = "fk_administrativos_persona"))
@DiscriminatorValue("ADMINISTRATIVO")
public class Administrativo extends Persona {
    @Column(name = "codigo_administrativo", nullable = false, length = 30)
    private String codigoAdministrativo;

    @Column(nullable = false, length = 80)
    private String cargo;

    @Builder.Default
    @Column(nullable = false)
    private Boolean activo = true;
}
