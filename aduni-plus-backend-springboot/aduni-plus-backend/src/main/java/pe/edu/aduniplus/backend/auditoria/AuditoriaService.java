package pe.edu.aduniplus.backend.auditoria;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.aduniplus.backend.usuario.Usuario;
import pe.edu.aduniplus.backend.usuario.UsuarioRepository;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuditoriaService {

    private final LogAuditoriaRepository repository;
    private final UsuarioRepository usuarioRepository;

    @Transactional
    public void registrarAccion(String username, String accion, String modulo, String detalles) {
        registrarAccion(username, accion, modulo, null, null, detalles);
    }

    @Transactional
    public void registrarAccion(String username, String accion, String modulo, Long idRegistroAfectado, String ipOrigen, String detalles) {
        if (username == null || username.equals("SISTEMA")) return;

        Optional<Usuario> userOpt = usuarioRepository.findByUsername(username);
        if (userOpt.isEmpty()) return;

        LogAuditoria log = LogAuditoria.builder()
                .usuarioObj(userOpt.get())
                .accion(accion)
                .modulo(modulo)
                .idRegistroAfectado(idRegistroAfectado)
                .ipOrigen(ipOrigen)
                .detalles(detalles)
                .build();
        repository.save(log);
    }

    public List<LogAuditoria> obtenerUltimosLogs() {
        return repository.findTop100ByOrderByFechaDesc();
    }

    public Page<LogAuditoria> obtenerLogsPaginados(String usuario, String accion, String tabla, Pageable pageable) {
        return repository.filtrar(usuario, accion, tabla, pageable);
    }

    public Page<LogAuditoria> listarConFiltros(String usuario, String accion, String tabla, Pageable pageable) {
        return repository.filtrar(usuario, accion, tabla, pageable);
    }
}
