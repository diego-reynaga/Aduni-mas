package pe.edu.aduniplus.backend.auditoria;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface AuditoriaRepository extends JpaRepository<Auditoria, Long> {
    List<Auditoria> findByEntidadAndEntidadId(String entidad, Long entidadId);
    List<Auditoria> findByUsuarioId(Long usuarioId);

    @Query("SELECT a FROM Auditoria a WHERE " +
           "(:usuario IS NULL OR LOWER(a.usuarioResponsable) LIKE LOWER(CONCAT('%', :usuario, '%'))) AND " +
           "(:accion IS NULL OR a.accion = :accion) AND " +
           "(:entidad IS NULL OR a.entidad = :entidad) AND " +
           "(:fechaInicio IS NULL OR a.creadoEn >= :fechaInicio) AND " +
           "(:fechaFin IS NULL OR a.creadoEn <= :fechaFin) " +
           "ORDER BY a.creadoEn DESC")
    List<Auditoria> buscarAuditorias(
        @Param("usuario") String usuario,
        @Param("accion") String accion,
        @Param("entidad") String entidad,
        @Param("fechaInicio") LocalDateTime fechaInicio,
        @Param("fechaFin") LocalDateTime fechaFin
    );
}

