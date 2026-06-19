package pe.edu.aduniplus.backend.usuario;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.aduniplus.backend.usuario.dto.RolRequest;
import pe.edu.aduniplus.backend.usuario.dto.RolResponse;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RolService {

    private final RolRepository rolRepository;

    @Transactional(readOnly = true)
    public List<RolResponse> listarRoles() {
        return rolRepository.findAll().stream()
            .map(this::mapToResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public RolResponse obtenerRol(Long id) {
        Rol rol = rolRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado con ID: " + id));
        return mapToResponse(rol);
    }

    @Transactional
    public RolResponse crearRol(RolRequest request) {
        RolNombre rolNombre = validarYObtenerRolNombre(request.nombre());
        
        if (rolRepository.findByNombre(rolNombre).isPresent()) {
            throw new IllegalArgumentException("El rol " + rolNombre + " ya existe");
        }

        Rol rol = Rol.builder()
            .nombre(rolNombre)
            .build();

        rol = rolRepository.save(rol);
        return mapToResponse(rol);
    }

    @Transactional
    public RolResponse actualizarRol(Long id, RolRequest request) {
        Rol rol = rolRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado con ID: " + id));

        RolNombre nuevoNombre = validarYObtenerRolNombre(request.nombre());
        
        rolRepository.findByNombre(nuevoNombre).ifPresent(r -> {
            if (!r.getId().equals(id)) {
                throw new IllegalArgumentException("Ya existe otro rol con el nombre " + nuevoNombre);
            }
        });

        rol.setNombre(nuevoNombre);
        rol = rolRepository.save(rol);
        return mapToResponse(rol);
    }

    @Transactional
    public void eliminarRol(Long id) {
        Rol rol = rolRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado con ID: " + id));
        
        rolRepository.delete(rol);
    }

    private RolNombre validarYObtenerRolNombre(String nombre) {
        try {
            return RolNombre.valueOf(nombre.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Nombre de rol no válido: " + nombre + ". Debe ser uno de: ADMINISTRADOR, DOCENTE, ESTUDIANTE, PADRE_FAMILIA");
        }
    }

    private RolResponse mapToResponse(Rol rol) {
        return new RolResponse(
            rol.getId(),
            rol.getNombre().name(),
            rol.getCreadoEn(),
            rol.getActualizadoEn()
        );
    }
}
