package pe.edu.aduniplus.backend.notas.importacion;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

final class NombreNormalizador {
    private NombreNormalizador() {
    }

    static String normalizar(String value) {
        if (value == null) {
            return "";
        }

        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "");
        normalized = normalized.replaceAll("[^\\p{IsAlphabetic}\\p{IsDigit}\\s]", " ");
        return normalized.replaceAll("\\s+", " ").trim().toUpperCase(Locale.ROOT);
    }

    static String normalizarDocente(String value) {
        return normalizar(value)
            .replaceAll("\\b(PROF|PROFA|PROFESOR|PROFESORA|DOCENTE|LIC|LICENCIADO|LICENCIADA)\\b", " ")
            .replaceAll("\\s+", " ")
            .trim();
    }

    static boolean mismosTokens(String left, String right) {
        Set<String> leftTokens = tokens(normalizarDocente(left));
        Set<String> rightTokens = tokens(normalizarDocente(right));
        if (leftTokens.isEmpty() || rightTokens.isEmpty()) {
            return false;
        }

        return leftTokens.containsAll(rightTokens) || rightTokens.containsAll(leftTokens);
    }

    private static Set<String> tokens(String value) {
        return Arrays.stream(value.split("\\s+"))
            .filter((part) -> part.length() > 1)
            .collect(Collectors.toSet());
    }
}
