package pe.edu.aduniplus.backend.persona;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import lombok.Builder;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(
    name = "administrativo",
    uniqueConstraints = @UniqueConstraint(name = "uk_administrativo_codigo", columnNames = "codigo_administrativo")
)
@PrimaryKeyJoinColumn(name = "persona_id", foreignKey = @ForeignKey(name = "fk_administrativo_persona"))
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
