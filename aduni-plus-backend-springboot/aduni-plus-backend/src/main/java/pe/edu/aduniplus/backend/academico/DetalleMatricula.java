package pe.edu.aduniplus.backend.academico;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.Builder;
import lombok.experimental.SuperBuilder;
import pe.edu.aduniplus.backend.common.BaseEntity;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(
    name = "detallematricula",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_detallematricula_matricula_curso",
        columnNames = {"matricula_id", "curso_id"}
    ),
    indexes = {
        @Index(name = "idx_detallematricula_matricula", columnList = "matricula_id"),
        @Index(name = "idx_detallematricula_curso", columnList = "curso_id")
    }
)
public class DetalleMatricula extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "matricula_id", nullable = false, foreignKey = @ForeignKey(name = "fk_detallematricula_matricula"))
    private Matricula matricula;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "curso_id", nullable = false, foreignKey = @ForeignKey(name = "fk_detallematricula_curso"))
    private Curso curso;

    @Column(nullable = false)
    private LocalDate fechaRegistro;

    @Builder.Default
    @Column(nullable = false)
    private Boolean estado = true;

    @PrePersist
    protected void ensureFechaRegistro() {
        if (fechaRegistro == null) {
            fechaRegistro = LocalDate.now();
        }
    }
}
