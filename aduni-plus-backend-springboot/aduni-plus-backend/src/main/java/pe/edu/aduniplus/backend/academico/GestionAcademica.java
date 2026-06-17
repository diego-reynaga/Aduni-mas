package pe.edu.aduniplus.backend.academico;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import pe.edu.aduniplus.backend.common.BaseEntity;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(
    name = "gestion_academica",
    uniqueConstraints = @UniqueConstraint(name = "uk_gestion_academica_anio", columnNames = "anio")
)
public class GestionAcademica extends BaseEntity {
    @Column(nullable = false)
    private Integer anio;

    @Column(nullable = false, length = 80)
    private String nombre;

    private LocalDate fechaInicio;

    private LocalDate fechaFin;

    @Builder.Default
    @Column(nullable = false)
    private Boolean activa = true;
}
