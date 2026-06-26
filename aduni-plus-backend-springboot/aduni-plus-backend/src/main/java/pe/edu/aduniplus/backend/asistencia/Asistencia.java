package pe.edu.aduniplus.backend.asistencia;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import pe.edu.aduniplus.backend.common.BaseEntity;
import pe.edu.aduniplus.backend.academico.AsignacionDocente;
import pe.edu.aduniplus.backend.persona.Persona;
import pe.edu.aduniplus.backend.usuario.Usuario;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Entity
@Table(name = "asistencias",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_asistencias_persona_fecha_curso",
        columnNames = {"persona_id", "fecha", "asignacion_docente_id"}
    ),
    indexes = {
        @Index(name = "idx_asistencias_fecha", columnList = "fecha"),
        @Index(name = "idx_asistencias_persona", columnList = "persona_id")
    }
)
public class Asistencia extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "persona_id", nullable = false,
        foreignKey = @ForeignKey(name = "fk_asistencias_persona"))
    private Persona persona;

    @Column(nullable = false)
    private LocalDate fecha;

    private LocalTime horaIngreso;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private EstadoAsistencia estado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asignacion_docente_id",
        foreignKey = @ForeignKey(name = "fk_asistencias_asignacion"))
    private AsignacionDocente asignacionDocente;

    @Column(columnDefinition = "TEXT")
    private String observacion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "registrado_por_id", nullable = false,
        foreignKey = @ForeignKey(name = "fk_asistencias_registro"))
    private Usuario registradoPor;
}
