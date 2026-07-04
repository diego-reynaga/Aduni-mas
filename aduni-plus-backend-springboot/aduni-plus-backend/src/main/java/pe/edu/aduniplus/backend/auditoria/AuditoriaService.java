package pe.edu.aduniplus.backend.auditoria;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.aduniplus.backend.auditoria.dto.AuditoriaResponse;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import pe.edu.aduniplus.backend.usuario.Usuario;
import pe.edu.aduniplus.backend.usuario.UsuarioRepository;

@Service
@RequiredArgsConstructor
public class AuditoriaService {

    private final AuditoriaRepository auditoriaRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public List<AuditoriaResponse> listarAuditorias(
            String usuario,
            String accion,
            String entidad,
            LocalDate fechaInicio,
            LocalDate fechaFin
    ) {
        LocalDateTime start = null;
        if (fechaInicio != null) {
            start = fechaInicio.atStartOfDay();
        }

        LocalDateTime end = null;
        if (fechaFin != null) {
            end = fechaFin.atTime(LocalTime.MAX);
        }

        // Si los campos de texto están vacíos, los tratamos como nulos para la query
        String userQuery = (usuario != null && !usuario.isBlank()) ? usuario.trim() : null;
        String actionQuery = (accion != null && !accion.isBlank() && !accion.equalsIgnoreCase("TODAS")) ? accion.trim() : null;
        String entityQuery = (entidad != null && !entidad.isBlank() && !entidad.equalsIgnoreCase("TODAS")) ? entidad.trim() : null;

        return auditoriaRepository.buscarAuditorias(userQuery, actionQuery, entityQuery, start, end).stream()
                .map(this::mapToResponse)
                .toList();
    }

    private AuditoriaResponse mapToResponse(Auditoria a) {
        return new AuditoriaResponse(
                a.getId(),
                a.getCreadoEn(),
                a.getAccion(),
                a.getEntidad(),
                a.getEntidadId(),
                a.getUsuarioResponsable(),
                a.getDetalle()
        );
    }

    @Transactional
    public void registrarAuditoria(String accion, String entidad, Long entidadId, String detalle) {
        String usuarioStr = "SISTEMA";
        var authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && !authentication.getPrincipal().equals("anonymousUser")) {
            usuarioStr = authentication.getName();
        }

        Usuario usuarioEntity = usuarioRepository.findByUsername(usuarioStr).orElse(null);

        Auditoria auditoria = Auditoria.builder()
                .accion(accion)
                .entidad(entidad)
                .entidadId(entidadId)
                .usuario(usuarioEntity)
                .usuarioResponsable(usuarioStr)
                .detalle(detalle)
                .build();
        auditoriaRepository.save(auditoria);
    }
}
