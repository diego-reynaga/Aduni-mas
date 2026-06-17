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
    name = "asignatura",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_asignatura_nombre", columnNames = "nombre"),
        @UniqueConstraint(name = "uk_asignatura_codigo", columnNames = "codigo")
    }
)
public class Materia extends BaseEntity {
    @Column(length = 20)
    private String codigo;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(length = 20)
    private String area;

    @Builder.Default
    @Column(nullable = false)
    private Boolean activa = true;
}
