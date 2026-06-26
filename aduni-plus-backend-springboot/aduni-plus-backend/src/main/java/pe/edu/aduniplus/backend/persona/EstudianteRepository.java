package pe.edu.aduniplus.backend.persona;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface EstudianteRepository extends JpaRepository<Estudiante, Long> {
    Optional<Estudiante> findByCodigoEstudiante(String codigoEstudiante);
    boolean existsByCodigoEstudiante(String codigoEstudiante);
    Optional<Estudiante> findByDocumentoIdentidad(String documentoIdentidad);

    @Query("SELECT e FROM Estudiante e WHERE " +
           "(:activo IS NULL OR e.activo = :activo) AND " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(e.nombres) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.apellidos) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.documentoIdentidad) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.codigoEstudiante) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Estudiante> buscarPorFiltros(@Param("search") String search, @Param("activo") Boolean activo);
}
