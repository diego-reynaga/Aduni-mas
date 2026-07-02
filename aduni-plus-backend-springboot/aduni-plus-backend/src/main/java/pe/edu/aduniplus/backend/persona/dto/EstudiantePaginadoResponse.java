package pe.edu.aduniplus.backend.persona.dto;

import java.util.List;

public record EstudiantePaginadoResponse(
    List<EstudianteBuscarResponse> contenido,
    int pagina,
    int totalPaginas,
    long totalElementos,
    int tamanioPagina
) {}
