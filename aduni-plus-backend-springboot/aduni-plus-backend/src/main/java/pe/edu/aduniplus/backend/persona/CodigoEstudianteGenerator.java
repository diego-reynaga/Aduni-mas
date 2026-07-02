package pe.edu.aduniplus.backend.persona;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.time.Year;

@Component
@RequiredArgsConstructor
public class CodigoEstudianteGenerator {

    private final EstudianteRepository estudianteRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String generarSiguiente() {
        String anio = String.valueOf(Year.now().getValue());
        String prefijo = "EST-" + anio + "-";
        String ultimo = estudianteRepository.findMaxCodigoByPrefijo(prefijo);
        int secuencial = 1;
        if (ultimo != null) {
            String[] partes = ultimo.split("-");
            secuencial = Integer.parseInt(partes[2]) + 1;
        }
        return String.format("EST-%s-%04d", anio, secuencial);
    }
}
