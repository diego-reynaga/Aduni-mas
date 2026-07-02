package pe.edu.aduniplus.backend.academico;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.time.Year;

@Component
@RequiredArgsConstructor
public class CodigoMatriculaGenerator {

    private final MatriculaRepository matriculaRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String generarSiguiente() {
        String anio = String.valueOf(Year.now().getValue());
        String prefijo = "MAT-" + anio + "-";
        String ultimo = matriculaRepository.findMaxCodigoByPrefijo(prefijo);
        int secuencial = 1;
        if (ultimo != null) {
            String[] partes = ultimo.split("-");
            secuencial = Integer.parseInt(partes[2]) + 1;
        }
        return String.format("MAT-%s-%06d", anio, secuencial);
    }
}
