package pe.edu.aduniplus.backend.persona;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "personal_institucional")
public class PersonalInstitucional {

    @Id
    @Column(name = "id_personal")
    private Long id;

    @OneToOne
    @MapsId
    @JoinColumn(name = "id_personal")
    private Persona persona;

    @Column(name = "fecha_ingreso", nullable = false)
    private LocalDate fechaIngreso;

    @Column(nullable = false, length = 100)
    private String cargo;
}
