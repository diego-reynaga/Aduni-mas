package pe.edu.aduniplus.backend.notas.importacion;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import pe.edu.aduniplus.backend.common.BaseEntity;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(
    name = "error_importacion_excel",
    indexes = @Index(name = "idx_error_importacion_excel_importacion", columnList = "importacion_id")
)
public class ErrorImportacionExcel extends BaseEntity {
    @Column(name = "importacion_id", nullable = false)
    private Long importacionId;

    @Column
    private Integer filaExcel;

    @Column(length = 180)
    private String estudianteTexto;

    @Column(length = 80)
    private String campo;

    @Column(nullable = false, length = 500)
    private String descripcionError;
}
