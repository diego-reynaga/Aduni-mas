package pe.edu.aduniplus.backend.academico.dto;

import java.time.LocalTime;

public record TurnoResponse(Long id, String nombre, LocalTime horaInicio, LocalTime horaFin) {}
