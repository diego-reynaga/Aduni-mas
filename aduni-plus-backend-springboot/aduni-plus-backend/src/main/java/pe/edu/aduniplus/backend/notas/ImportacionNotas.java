package pe.edu.aduniplus.backend.notas;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import pe.edu.aduniplus.backend.academico.AsignacionDocente;
import pe.edu.aduniplus.backend.academico.Curso;
import pe.edu.aduniplus.backend.academico.PeriodoAcademico;
import pe.edu.aduniplus.backend.common.BaseEntity;
import pe.edu.aduniplus.backend.persona.Docente;
import pe.edu.aduniplus.backend.usuario.Usuario;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(name = "importacion_excel")
public class ImportacionNotas extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "asignacion_docente_id", nullable = false, foreignKey = @ForeignKey(name = "fk_importaciones_asignaciondocente"))
    private AsignacionDocente asignacionDocente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_responsable_id", nullable = false, foreignKey = @ForeignKey(name = "fk_importaciones_usuario"))
    private Usuario usuarioResponsable;

    @Column(nullable = false, length = 180)
    private String nombreArchivo;

    @Column(length = 128)
    private String hashArchivo;

    private Integer anio;

    @Column(length = 80)
    private String nivel;

    @Column(length = 150)
    private String institucion;

    @Column(length = 150)
    private String lugar;

    @Column(length = 120)
    private String areaCurricular;

    @Column(length = 150)
    private String docenteExcel;

    @Column(length = 80)
    private String grado;

    @Column(length = 20)
    private String seccion;

    @Column(length = 120)
    private String periodosImportados;

    @Column(length = 20)
    private String trimestre;

    @Builder.Default
    @Column(nullable = false)
    private Integer totalRegistros = 0;

    @Builder.Default
    @Column(nullable = false)
    private Integer registrosValidos = 0;

    @Builder.Default
    @Column(nullable = false)
    private Integer registrosObservados = 0;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false, length = 30)
    private EstadoImportacionNotas estado = EstadoImportacionNotas.PENDIENTE;

    @Column(columnDefinition = "TEXT")
    private String detalle;

    @Transient
    public Docente getDocente() {
        return asignacionDocente == null ? null : asignacionDocente.getDocente();
    }

    @Transient
    public Curso getCurso() {
        return asignacionDocente == null ? null : asignacionDocente.getCurso();
    }

    @Transient
    public PeriodoAcademico getPeriodoAcademico() {
        return asignacionDocente == null ? null : asignacionDocente.getPeriodoAcademico();
    }
}
