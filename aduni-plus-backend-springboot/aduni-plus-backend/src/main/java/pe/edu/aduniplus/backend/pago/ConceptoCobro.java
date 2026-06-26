package pe.edu.aduniplus.backend.pago;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import pe.edu.aduniplus.backend.common.BaseEntity;

@Getter
@Setter
@Entity
@Table(name = "conceptos_cobro")
public class ConceptoCobro extends BaseEntity {

    @Column(nullable = false, unique = true, length = 20)
    private String codigo;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(length = 250)
    private String descripcion;

    @Column(nullable = false)
    private Boolean activo = true;
}
