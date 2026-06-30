package pe.edu.aduniplus.backend.academico;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "secciones")
public class Seccion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_seccion")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ciclo_id", nullable = false)
    private CicloAcademico ciclo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "turno_id", nullable = false)
    private Turno turno;

    @Column(name = "nombre_seccion", nullable = false, length = 10)
    private String nombre;

    @Column(name = "cupo_maximo", nullable = false)
    private int cupoMaximo;

    @Version
    @Column(name = "version")
    private Long version;
}
