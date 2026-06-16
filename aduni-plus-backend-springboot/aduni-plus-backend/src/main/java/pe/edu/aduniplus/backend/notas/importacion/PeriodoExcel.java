package pe.edu.aduniplus.backend.notas.importacion;

public enum PeriodoExcel {
    I_TRIMESTRE("I TRIMESTRE", 1, "PROMEDIO FINAL I TRIMESTRE"),
    II_TRIMESTRE("II TRIMESTRE", 2, "PROMEDIO FINAL II TRIMESTRE"),
    III_TRIMESTRE("III TRIMESTRE", 3, "PROMEDIO FINAL III TRIMESTRE"),
    ANUAL("ANUAL", 4, "PROMEDIO ANUAL IMPORTADO");

    private final String nombre;
    private final int orden;
    private final String evaluacionNombre;

    PeriodoExcel(String nombre, int orden, String evaluacionNombre) {
        this.nombre = nombre;
        this.orden = orden;
        this.evaluacionNombre = evaluacionNombre;
    }

    public String nombre() {
        return nombre;
    }

    public int orden() {
        return orden;
    }

    public String evaluacionNombre() {
        return evaluacionNombre;
    }

    public boolean esTrimestre() {
        return this == I_TRIMESTRE || this == II_TRIMESTRE || this == III_TRIMESTRE;
    }
}
