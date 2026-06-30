package pe.edu.aduniplus.backend.academico;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "materias")
public class Materia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_materia")
    private Long id;

    @Column(name = "nombre_materia", nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, length = 20)
    private String area;
}
