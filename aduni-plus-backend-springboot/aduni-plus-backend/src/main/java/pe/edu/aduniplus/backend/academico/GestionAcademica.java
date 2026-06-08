package pe.edu.aduniplus.backend.academico;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import pe.edu.aduniplus.backend.common.BaseEntity;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(
    name = "gestiones_academicas",
    uniqueConstraints = @UniqueConstraint(name = "uk_gestiones_anio", columnNames = "anio")
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

    @OneToMany(mappedBy = "gestionAcademica")
    @Builder.Default
    private Set<NivelEducativo> niveles = new HashSet<>();

    @OneToMany(mappedBy = "gestionAcademica")
    @Builder.Default
    private Set<PeriodoAcademico> periodos = new HashSet<>();
}
