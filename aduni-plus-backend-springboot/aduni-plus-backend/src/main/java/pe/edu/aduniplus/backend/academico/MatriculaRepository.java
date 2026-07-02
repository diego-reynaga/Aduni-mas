package pe.edu.aduniplus.backend.academico;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface MatriculaRepository extends JpaRepository<Matricula, Long> {
    List<Matricula> findByEstudianteId(Long estudianteId);
    List<Matricula> findBySeccionId(Long seccionId);
    boolean existsByEstudianteIdAndSeccionId(Long estudianteId, Long seccionId);
    int countBySeccionIdAndEstado(Long seccionId, String estado);

    @Query("SELECT m.codigoMatricula FROM Matricula m WHERE m.codigoMatricula LIKE :prefijo ORDER BY m.codigoMatricula DESC")
    List<String> findCodigosByPrefijo(@Param("prefijo") String prefijo, Pageable pageable);

    @Query("SELECT m.codigoMatricula FROM Matricula m WHERE m.codigoMatricula LIKE :prefijo ORDER BY m.codigoMatricula DESC")
    Optional<String> findLastCodigoByPrefijo(@Param("prefijo") String prefijo, Pageable pageable);

    default String findMaxCodigoByPrefijo(String prefijo) {
        return findLastCodigoByPrefijo(prefijo, Pageable.ofSize(1)).orElse(null);
    }
}
