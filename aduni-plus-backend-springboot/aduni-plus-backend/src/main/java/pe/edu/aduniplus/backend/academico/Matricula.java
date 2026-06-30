package pe.edu.aduniplus.backend.academico;

import jakarta.persistence.*;
import lombok.*;
import pe.edu.aduniplus.backend.persona.Persona;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "matriculas")
public class Matricula {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_matricula")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "estudiante_id", nullable = false)
    private Persona estudiante;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seccion_id", nullable = false)
    private Seccion seccion;

    @Column(name = "fecha_matricula", nullable = false)
    private LocalDate fechaMatricula;

    @Column(name = "monto_total_pactado", nullable = false, precision = 10, scale = 2)
    private BigDecimal montoTotalPactado;

    @Builder.Default
    @Column(name = "estado_matricula", nullable = false, length = 20)
    private String estado = "Activo";
}
