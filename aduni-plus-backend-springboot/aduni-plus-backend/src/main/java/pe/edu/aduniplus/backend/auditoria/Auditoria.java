package pe.edu.aduniplus.backend.auditoria;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import pe.edu.aduniplus.backend.common.BaseEntity;
import pe.edu.aduniplus.backend.usuario.Usuario;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(name = "auditoria")
public class Auditoria extends BaseEntity {
    @Column(nullable = false, length = 80)
    private String accion;

    @Column(nullable = false, length = 80)
    private String entidad;

    private Long entidadId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", foreignKey = @ForeignKey(name = "fk_auditorias_usuario"))
    private Usuario usuario;

    @Column(nullable = false, length = 80)
    private String usuarioResponsable;

    @Column(columnDefinition = "TEXT")
    private String detalle;
}
