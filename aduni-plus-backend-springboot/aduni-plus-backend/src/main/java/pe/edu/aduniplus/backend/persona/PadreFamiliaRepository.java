package pe.edu.aduniplus.backend.persona;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface PadreFamiliaRepository extends JpaRepository<PadreFamilia, Long> {
    
    @Query("SELECT p FROM PadreFamilia p WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(p.nombres) LIKE LOWER(CONCAT('%',:search,'%')) OR " +
           "LOWER(p.apellidos) LIKE LOWER(CONCAT('%',:search,'%')) OR " +
           "LOWER(p.documentoIdentidad) LIKE LOWER(CONCAT('%',:search,'%')))")
    List<PadreFamilia> buscarPorFiltros(@Param("search") String search);
}
