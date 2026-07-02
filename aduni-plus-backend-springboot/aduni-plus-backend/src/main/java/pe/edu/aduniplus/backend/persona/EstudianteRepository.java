package pe.edu.aduniplus.backend.persona;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface EstudianteRepository extends JpaRepository<Estudiante, Long> {
    Optional<Estudiante> findByCodigoEstudiante(String codigoEstudiante);
    boolean existsByCodigoEstudiante(String codigoEstudiante);
    List<Estudiante> findByApoderadoId(Long apoderadoId);

    @Query("SELECT e.codigoEstudiante FROM Estudiante e WHERE e.codigoEstudiante LIKE :prefijo ORDER BY e.codigoEstudiante DESC")
    List<String> findCodigosByPrefijo(@Param("prefijo") String prefijo, Pageable pageable);

    @Query("SELECT e.codigoEstudiante FROM Estudiante e WHERE e.codigoEstudiante LIKE :prefijo ORDER BY e.codigoEstudiante DESC")
    Optional<String> findLastCodigoByPrefijo(@Param("prefijo") String prefijo, Pageable pageable);

    default String findMaxCodigoByPrefijo(String prefijo) {
        return findLastCodigoByPrefijo(prefijo, Pageable.ofSize(1)).orElse(null);
    }

    @Query(value = """
        SELECT e FROM Estudiante e JOIN FETCH e.persona p
        WHERE (:q IS NULL OR p.nombres LIKE %:q%
               OR p.apellidos LIKE %:q%
               OR e.codigoEstudiante LIKE %:q%
               OR p.numeroDocumento LIKE %:q%)
        AND (:estado IS NULL OR e.estadoAcademico = :estado)
        """)
    Page<Estudiante> buscarConPaginacion(
        @Param("q") String query,
        @Param("estado") String estado,
        Pageable pageable);

    @Query(value = """
        SELECT e FROM Estudiante e JOIN FETCH e.persona p
        WHERE (:q IS NULL OR p.nombres LIKE %:q%
               OR p.apellidos LIKE %:q%
               OR e.codigoEstudiante LIKE %:q%
               OR p.numeroDocumento LIKE %:q%)
        AND e.estadoAcademico = 'Regular'
        """)
    List<Estudiante> buscarActivos(@Param("q") String query, Pageable pageable);
}
