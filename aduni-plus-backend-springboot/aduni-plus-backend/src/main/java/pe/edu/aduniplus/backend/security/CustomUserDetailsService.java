package pe.edu.aduniplus.backend.security;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.aduniplus.backend.usuario.Usuario;
import pe.edu.aduniplus.backend.usuario.UsuarioRepository;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {
    private final UsuarioRepository usuarioRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));
        return toAuthenticatedUser(usuario);
    }

    @Transactional(readOnly = true)
    public AuthenticatedUser loadById(Long userId) {
        Usuario usuario = usuarioRepository.findById(userId)
            .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));
        return toAuthenticatedUser(usuario);
    }

    private AuthenticatedUser toAuthenticatedUser(Usuario usuario) {
        return new AuthenticatedUser(
            usuario.getId(),
            usuario.getPersona().getId(),
            usuario.getUsername(),
            usuario.getPassword(),
            Boolean.TRUE.equals(usuario.getActivo()),
            List.of(usuario.getRol().getNombre())
        );
    }
}
