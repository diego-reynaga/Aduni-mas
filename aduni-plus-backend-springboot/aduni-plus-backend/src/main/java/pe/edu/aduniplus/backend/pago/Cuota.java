package pe.edu.aduniplus.backend.pago;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import pe.edu.aduniplus.backend.common.BaseEntity;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "cuotas")
public class Cuota extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cronograma_id", nullable = false)
    private CronogramaPago cronograma;

    @Column(name = "numero_cuota", nullable = false)
    private Integer numeroCuota;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "concepto_cobro_id", nullable = false)
    private ConceptoCobro conceptoCobro;

    @Column(name = "fecha_vencimiento", nullable = false)
    private LocalDate fechaVencimiento;

    @Column(name = "monto_programado", nullable = false, precision = 10, scale = 2)
    private BigDecimal montoProgramado;

    @Column(name = "saldo_pendiente", nullable = false, precision = 10, scale = 2)
    private BigDecimal saldoPendiente;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private EstadoCuota estado = EstadoCuota.PENDIENTE;
}
