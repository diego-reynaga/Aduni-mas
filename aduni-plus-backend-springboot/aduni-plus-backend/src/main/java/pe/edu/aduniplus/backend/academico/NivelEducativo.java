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
    name = "niveles_educativos",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_niveles_gestion_nombre_turno",
        columnNames = {"gestion_academica_id", "nombre", "turno"}
    )
)
public class NivelEducativo extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "gestion_academica_id", nullable = false, foreignKey = @ForeignKey(name = "fk_niveles_gestion"))
    private GestionAcademica gestionAcademica;

    @Column(nullable = false, length = 80)
    private String nombre;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Turno turno;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ModalidadCiclo modalidad;

    private LocalDate fechaInicio;
    private LocalDate fechaFin;

    @Column(length = 250)
    private String descripcion;

    @Builder.Default
    @Column(nullable = false)
    private Boolean activo = true;

    @OneToMany(mappedBy = "nivelEducativo")
    @Builder.Default
    private Set<Grado> grados = new HashSet<>();
}
