package pe.edu.aduniplus.backend.academico;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface MatriculaRepository extends JpaRepository<Matricula, Long> {
    Optional<Matricula> findByCodigoMatricula(String codigoMatricula);
    Optional<Matricula> findByEstudianteIdAndGradoId(Long estudianteId, Long gradoId);
    List<Matricula> findByEstudianteId(Long estudianteId);
    List<Matricula> findByGradoId(Long gradoId);
    List<Matricula> findByGradoIdAndEstado(Long gradoId, EstadoMatricula estado);
    boolean existsByEstudianteIdAndGradoId(Long estudianteId, Long gradoId);
    
    List<Matricula> findByEstudianteIdOrderByFechaMatriculaDesc(Long estudianteId);

    @Query("SELECT m FROM Matricula m WHERE m.estudiante.id = :estId AND m.grado.nivelEducativo.id = :nivelId AND m.estado = :estado")
    List<Matricula> findByEstudianteAndNivelAndEstado(@org.springframework.data.repository.query.Param("estId") Long estudianteId, @org.springframework.data.repository.query.Param("nivelId") Long nivelId, @org.springframework.data.repository.query.Param("estado") EstadoMatricula estado);

    @Query("SELECT COUNT(m) FROM Matricula m WHERE m.grado.id = :gradoId AND m.estado IN :estados")
    long countByGradoIdAndEstadoIn(@org.springframework.data.repository.query.Param("gradoId") Long gradoId, @org.springframework.data.repository.query.Param("estados") List<EstadoMatricula> estados);
}
