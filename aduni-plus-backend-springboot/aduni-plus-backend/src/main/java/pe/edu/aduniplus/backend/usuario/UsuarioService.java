package pe.edu.aduniplus.backend.usuario;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.aduniplus.backend.persona.Persona;
import pe.edu.aduniplus.backend.persona.PersonaRepository;
import pe.edu.aduniplus.backend.usuario.dto.UsuarioRequest;
import pe.edu.aduniplus.backend.usuario.dto.UsuarioResponse;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

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
            throw new IllegalArgumentException("La contraseña es obligatoria para nuevos usuarios");
        }

        if (usuarioRepository.findByUsername(request.username()).isPresent()) {
            throw new IllegalArgumentException("El nombre de usuario ya existe");
        }

        Persona persona = personaRepository.findById(request.personaId())
            .orElseThrow(() -> new RuntimeException("Persona no encontrada"));

        Set<Rol> roles = mapearRoles(request.roles());

        Usuario usuario = Usuario.builder()
            .username(request.username())
            .password(passwordEncoder.encode(request.password()))
            .persona(persona)
            .roles(roles)
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
        if (request.personaId() != null && !usuario.getPersona().getId().equals(request.personaId())) {
            Persona persona = personaRepository.findById(request.personaId())
                .orElseThrow(() -> new RuntimeException("Persona no encontrada"));
            usuario.setPersona(persona);
        }

        usuario.setRoles(mapearRoles(request.roles()));
        usuario = usuarioRepository.save(usuario);
        return mapToResponse(usuario);
    }

    @Transactional
    public void desactivarUsuario(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        usuario.setActivo(false);
        usuarioRepository.save(usuario);
    }

    @Transactional
    public void activarUsuario(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        usuario.setActivo(true);
        usuarioRepository.save(usuario);
    }

    private Set<Rol> mapearRoles(List<String> nombresRoles) {
        if (nombresRoles == null || nombresRoles.isEmpty()) {
            return new HashSet<>();
        }
        Set<Rol> roles = new HashSet<>();
        for (String nombre : nombresRoles) {
            try {
                RolNombre rolEnum = RolNombre.valueOf(nombre.toUpperCase());
                Rol rol = rolRepository.findByNombre(rolEnum)
                    .orElseThrow(() -> new RuntimeException("Rol no encontrado en la base de datos: " + nombre));
                roles.add(rol);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Nombre de rol inválido: " + nombre);
            }
        }
        return roles;
    }

    private UsuarioResponse mapToResponse(Usuario usuario) {
        return new UsuarioResponse(
            usuario.getId(),
            usuario.getUsername(),
            usuario.getActivo(),
            usuario.getPersona().getId(),
            usuario.getRoles().stream()
                .map(rol -> rol.getNombre().name())
                .collect(Collectors.toList())
        );
    }
}
