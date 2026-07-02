package pe.edu.aduniplus.backend.academico;

import java.util.Map;
import java.util.Set;

public enum EstadoMatricula {
    PRE_MATRICULADO,
    ACTIVO,
    RETIRADO,
    SUSPENDIDO,
    EGRESADO;

    private static final Map<EstadoMatricula, Set<EstadoMatricula>> TRANSICIONES = Map.of(
        PRE_MATRICULADO, Set.of(ACTIVO, RETIRADO),
        ACTIVO,          Set.of(RETIRADO, SUSPENDIDO, EGRESADO),
        SUSPENDIDO,      Set.of(ACTIVO, RETIRADO),
        RETIRADO,        Set.of(),
        EGRESADO,        Set.of()
    );

    public boolean puedeTransicionarA(EstadoMatricula destino) {
        return TRANSICIONES.getOrDefault(this, Set.of()).contains(destino);
    }

    public static EstadoMatricula fromString(String value) {
        if (value == null || value.isBlank()) return null;
        return valueOf(value.toUpperCase());
    }
}
