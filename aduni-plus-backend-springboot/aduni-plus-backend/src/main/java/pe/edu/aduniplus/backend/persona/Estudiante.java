package pe.edu.aduniplus.backend.persona;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "estudiantes")
public class Estudiante {

    @Id
    @Column(name = "id_estudiante")
    private Long id;

    @OneToOne
    @MapsId
    @JoinColumn(name = "id_estudiante")
    private Persona persona;

    @ManyToOne
    @JoinColumn(name = "id_apoderado")
    private Apoderado apoderado;

    @Column(name = "codigo_estudiante", length = 20, unique = true)
    private String codigoEstudiante;

    @Column(name = "estado_academico", length = 20)
    private String estadoAcademico = "Regular";
}
