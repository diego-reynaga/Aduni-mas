package pe.edu.aduniplus.backend.asistencia;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface AsistenciaEstudianteRepository extends JpaRepository<AsistenciaEstudiante, Long> {
    List<AsistenciaEstudiante> findByEstudianteIdAndFechaBetweenOrderByFechaAsc(Long estudianteId, LocalDate desde, LocalDate hasta);
    List<AsistenciaEstudiante> findBySeccionIdAndFecha(Long seccionId, LocalDate fecha);
}
