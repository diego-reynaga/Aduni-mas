package pe.edu.aduniplus.backend.academico.dto;

public record SeccionResponse(Long id, Long cicloId, String cicloNombre, Long turnoId, String turnoNombre, String nombre, int cupoMaximo, int cuposDisponibles, Long version) {}
