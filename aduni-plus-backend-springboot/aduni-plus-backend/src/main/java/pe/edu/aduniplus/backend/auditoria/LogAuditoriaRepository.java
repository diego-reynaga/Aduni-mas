package pe.edu.aduniplus.backend.auditoria;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LogAuditoriaRepository extends JpaRepository<LogAuditoria, Long> {

    List<LogAuditoria> findTop100ByOrderByFechaDesc();

    @Query("""
        SELECT l FROM LogAuditoria l
        WHERE (:usuario IS NULL OR l.usuarioObj.username LIKE %:usuario%)
        AND (:accion IS NULL OR l.accion = :accion)
        AND (:tabla IS NULL OR l.modulo LIKE %:tabla%)
        ORDER BY l.fecha DESC
    """)
    Page<LogAuditoria> filtrar(
        @Param("usuario") String usuario,
        @Param("accion") String accion,
        @Param("tabla") String tabla,
        Pageable pageable
    );
}
