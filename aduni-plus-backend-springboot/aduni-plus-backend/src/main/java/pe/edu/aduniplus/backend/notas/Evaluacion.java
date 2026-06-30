package pe.edu.aduniplus.backend.notas;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.edu.aduniplus.backend.academico.CicloAcademico;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "evaluaciones")
public class Evaluacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_evaluacion")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ciclo_id", nullable = false)
    private CicloAcademico ciclo;

    @Column(name = "nombre_evaluacion", nullable = false, length = 100)
    private String nombre;

    @Column(name = "fecha_evaluacion", nullable = false)
    private LocalDate fecha;
}
