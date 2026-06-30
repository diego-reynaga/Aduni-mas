package pe.edu.aduniplus.backend.auditoria;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import pe.edu.aduniplus.backend.usuario.Usuario;

import java.time.LocalDateTime;

@Entity
@Table(name = "log_auditoria")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class LogAuditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_log")
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    @JsonIgnore
    private Usuario usuarioObj;

    @Column(name = "tabla_afectada", nullable = false, length = 50)
    private String modulo;

    @Column(nullable = false, length = 50)
    private String accion;

    @Column(name = "id_registro_afectado")
    private Long idRegistroAfectado;

    @Column(name = "ip_origen", length = 45)
    private String ipOrigen;

    @Column(name = "descripcion_cambio", columnDefinition = "TEXT")
    private String detalles;

    @CreatedDate
    @Column(name = "fecha_hora", nullable = false, updatable = false)
    private LocalDateTime fecha;

    @JsonProperty("usuario")
    public String getUsuarioUsername() {
        return usuarioObj != null ? usuarioObj.getUsername() : "Desconocido";
    }
}
