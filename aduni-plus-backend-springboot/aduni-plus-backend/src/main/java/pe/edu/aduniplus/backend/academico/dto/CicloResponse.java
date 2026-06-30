package pe.edu.aduniplus.backend.academico.dto;

import java.time.LocalDate;

public record CicloResponse(Long id, String nombre, LocalDate fechaInicio, LocalDate fechaFin) {}
