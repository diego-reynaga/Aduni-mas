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
@Table(name = "apoderados")
public class Apoderado {

    @Id
    @Column(name = "id_apoderado")
    private Long id;

    @OneToOne
    @MapsId
    @JoinColumn(name = "id_apoderado")
    private Persona persona;

    @Column(name = "relacion_parentesco", nullable = false, length = 50)
    private String relacionParentesco;
}
