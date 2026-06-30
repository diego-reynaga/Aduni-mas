package pe.edu.aduniplus.backend.asistencia;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.edu.aduniplus.backend.academico.Seccion;
import pe.edu.aduniplus.backend.persona.Persona;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "asistencia_estudiante")
public class AsistenciaEstudiante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_asistencia_est")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estudiante_id", nullable = false)
    private Persona estudiante;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seccion_id", nullable = false)
    private Seccion seccion;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(name = "estado_asistencia", nullable = false, length = 20)
    private String estado;

    @Column(columnDefinition = "TEXT")
    private String observacion;
}
