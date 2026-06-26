package pe.edu.aduniplus.backend.pago;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import pe.edu.aduniplus.backend.common.BaseEntity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "recibos")
public class Recibo extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pago_id", nullable = false)
    private Pago pago;

    @Column(name = "numero_recibo", nullable = false, unique = true, length = 20)
    private String numeroRecibo;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal monto;

    @Column(name = "fecha_emision", nullable = false)
    private LocalDateTime fechaEmision;

    @Column(name = "ruta_pdf", length = 250)
    private String rutaPdf;
}
