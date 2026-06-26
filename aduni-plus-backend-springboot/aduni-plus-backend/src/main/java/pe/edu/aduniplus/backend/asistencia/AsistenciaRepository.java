package pe.edu.aduniplus.backend.asistencia;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AsistenciaRepository extends JpaRepository<Asistencia, Long> {

    Optional<Asistencia> findByPersonaIdAndFechaAndAsignacionDocenteId(
        Long personaId, LocalDate fecha, Long asignacionDocenteId);

    List<Asistencia> findByAsignacionDocenteIdAndFechaOrderByPersonaNombresAsc(
        Long asignacionDocenteId, LocalDate fecha);

    List<Asistencia> findByPersonaIdAndFechaBetweenOrderByFechaAsc(
        Long personaId, LocalDate desde, LocalDate hasta);

    List<Asistencia> findByPersonaIdAndAsignacionDocenteIdAndFechaBetween(
        Long personaId, Long asignacionDocenteId, LocalDate desde, LocalDate hasta);

    @Query("SELECT DISTINCT a.fecha FROM Asistencia a " +
           "WHERE a.asignacionDocente.id = :adId " +
           "AND a.fecha BETWEEN :desde AND :hasta ORDER BY a.fecha")
    List<LocalDate> findFechasByAsignacionDocenteId(
        @Param("adId") Long adId,
        @Param("desde") LocalDate desde,
        @Param("hasta") LocalDate hasta);

    long countByPersonaIdAndAsignacionDocenteIdAndEstado(
        Long personaId, Long adId, EstadoAsistencia estado);

    @Query("SELECT a.persona.id, a.estado, COUNT(a) FROM Asistencia a " +
           "WHERE a.asignacionDocente.id = :adId " +
           "AND a.fecha BETWEEN :desde AND :hasta " +
           "GROUP BY a.persona.id, a.estado")
    List<Object[]> contarPorEstadoPorCurso(
        @Param("adId") Long adId,
        @Param("desde") LocalDate desde,
        @Param("hasta") LocalDate hasta);

    List<Asistencia> findByAsignacionDocenteIdNullAndFecha(LocalDate fecha);

    List<Asistencia> findByAsignacionDocenteIdNullAndFechaBetweenOrderByPersonaNombresAsc(
        LocalDate desde, LocalDate hasta);

    List<Asistencia> findByPersonaIdAndAsignacionDocenteIdNullAndFechaBetween(
        Long personaId, LocalDate desde, LocalDate hasta);
}
