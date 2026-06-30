package pe.edu.aduniplus.backend.usuario;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.aduniplus.backend.persona.Persona;
import pe.edu.aduniplus.backend.persona.PersonaRepository;
import pe.edu.aduniplus.backend.usuario.dto.UsuarioRequest;
import pe.edu.aduniplus.backend.usuario.dto.UsuarioResponse;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PersonaRepository personaRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UsuarioResponse> listarUsuarios() {
        return usuarioRepository.findAll().stream()
            .map(this::mapToResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public UsuarioResponse obtenerUsuario(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return mapToResponse(usuario);
    }

    @Transactional
    public UsuarioResponse crearUsuario(UsuarioRequest request) {
        if (request.password() == null || request.password().isBlank()) {
            throw new RuntimeException("La contraseña es obligatoria para nuevos usuarios");
        }
        if (usuarioRepository.existsByUsername(request.username())) {
            throw new RuntimeException("El nombre de usuario ya existe");
        }
        Persona persona = personaRepository.findById(request.personaId())
            .orElseThrow(() -> new RuntimeException("Persona no encontrada"));

        Rol rol = rolRepository.findById(request.rolId())
            .orElseThrow(() -> new RuntimeException("Rol no encontrado"));

        Usuario usuario = Usuario.builder()
            .username(request.username())
            .password(passwordEncoder.encode(request.password()))
            .persona(persona)
            .rol(rol)
            .activo(true)
            .build();

        usuario = usuarioRepository.save(usuario);
        return mapToResponse(usuario);
    }

    @Transactional
    public UsuarioResponse actualizarUsuario(Long id, UsuarioRequest request) {
        Usuario usuario = usuarioRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        usuario.setUsername(request.username());
        if (request.password() != null && !request.password().isBlank()) {
            usuario.setPassword(passwordEncoder.encode(request.password()));
        }
        if (request.rolId() != null) {
            Rol rol = rolRepository.findById(request.rolId())
                .orElseThrow(() -> new RuntimeException("Rol no encontrado"));
            usuario.setRol(rol);
        }
        usuario = usuarioRepository.save(usuario);
        return mapToResponse(usuario);
    }

    @Transactional
    public void desactivarUsuario(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        usuario.setActivo(false);
    }

    @Transactional
    public void activarUsuario(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        usuario.setActivo(true);
    }

    private UsuarioResponse mapToResponse(Usuario usuario) {
        return new UsuarioResponse(
            usuario.getId(),
            usuario.getUsername(),
            usuario.getActivo(),
            usuario.getPersona().getId(),
            usuario.getRol().getId(),
            usuario.getRol().getNombre()
        );
    }
}
