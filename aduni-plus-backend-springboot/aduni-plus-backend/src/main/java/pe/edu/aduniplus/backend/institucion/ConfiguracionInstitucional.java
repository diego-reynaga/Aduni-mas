package pe.edu.aduniplus.backend.institucion;

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
    name = "configuracion_institucional",
    uniqueConstraints = @UniqueConstraint(name = "uk_configuracion_codigo", columnNames = "codigo")
)
public class ConfiguracionInstitucional extends BaseEntity {
    @Builder.Default
    @Column(nullable = false, length = 30)
    private String codigo = "PRINCIPAL";

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(length = 250)
    private String logoUrl;

    @Column(length = 200)
    private String direccion;

    @Column(length = 30)
    private String telefono;

    @Column(length = 150)
    private String correoInstitucional;

    @Column(length = 20)
    private String ruc;

    @Column(length = 150)
    private String sitioWeb;
}
