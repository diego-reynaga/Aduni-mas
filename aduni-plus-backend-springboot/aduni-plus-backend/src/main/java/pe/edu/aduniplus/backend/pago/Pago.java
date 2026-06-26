package pe.edu.aduniplus.backend.pago;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import pe.edu.aduniplus.backend.common.BaseEntity;
import pe.edu.aduniplus.backend.persona.Estudiante;
import pe.edu.aduniplus.backend.usuario.Usuario;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "pagos")
public class Pago extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cuota_id")
    private Cuota cuota;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cronograma_id")
    private CronogramaPago cronograma;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estudiante_id", nullable = false)
    private Estudiante estudiante;

    @Column(name = "monto_pagado", nullable = false, precision = 10, scale = 2)
    private BigDecimal montoPagado;

    @Column(name = "fecha_pago", nullable = false)
    private LocalDate fechaPago;

    @Enumerated(EnumType.STRING)
    @Column(name = "metodo_pago", nullable = false, length = 20)
    private MetodoPago metodoPago;

    @Column(name = "numero_comprobante", length = 50)
    private String numeroComprobante;

    @Column(length = 250)
    private String observacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_registro_id", nullable = false)
    private Usuario usuarioRegistro;

    @Column(nullable = false)
    private Boolean anulado = false;

    @Column(name = "fecha_anulacion")
    private LocalDateTime fechaAnulacion;

    @Column(name = "motivo_anulacion", length = 250)
    private String motivoAnulacion;

    @Column(name = "recibo_generado", nullable = false)
    private Boolean reciboGenerado = false;
}
