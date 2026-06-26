package pe.edu.aduniplus.backend.pago;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import pe.edu.aduniplus.backend.academico.GestionAcademica;
import pe.edu.aduniplus.backend.common.BaseEntity;
import pe.edu.aduniplus.backend.persona.Estudiante;
import pe.edu.aduniplus.backend.academico.Matricula;
import pe.edu.aduniplus.backend.usuario.Usuario;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "cronogramas_pago")
public class CronogramaPago extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estudiante_id", nullable = false)
    private Estudiante estudiante;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "matricula_id")
    private Matricula matricula;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gestion_academica_id")
    private GestionAcademica gestionAcademica;

    @Column(name = "total_cuotas", nullable = false)
    private Integer totalCuotas;

    @Column(name = "monto_total", nullable = false, precision = 10, scale = 2)
    private BigDecimal montoTotal;

    @Column(length = 250)
    private String observacion;

    @Column(nullable = false)
    private Boolean activo = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_creacion_id", nullable = false)
    private Usuario usuarioCreacion;

    @OneToMany(mappedBy = "cronograma", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Cuota> cuotas = new HashSet<>();
}
