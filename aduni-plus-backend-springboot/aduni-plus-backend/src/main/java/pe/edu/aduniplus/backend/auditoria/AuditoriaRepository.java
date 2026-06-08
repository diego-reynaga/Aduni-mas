package pe.edu.aduniplus.backend.auditoria;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditoriaRepository extends JpaRepository<Auditoria, Long> {
    List<Auditoria> findByEntidadAndEntidadId(String entidad, Long entidadId);
    List<Auditoria> findByUsuarioId(Long usuarioId);
}
