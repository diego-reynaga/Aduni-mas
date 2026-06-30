package pe.edu.aduniplus.backend.auditoria;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Arrays;
import java.util.Optional;

@Aspect
@Component
@RequiredArgsConstructor
public class AuditoriaAspect {

    private final AuditoriaService auditoriaService;

    @AfterReturning(
            pointcut = "(execution(* pe.edu.aduniplus.backend..*Controller.crear*(..)) || @annotation(org.springframework.web.bind.annotation.PostMapping)) && !execution(* pe.edu.aduniplus.backend.auth.AuthController.*(..))",
            returning = "result"
    )
    public void logCreacion(JoinPoint joinPoint, Object result) {
        registrarLog(joinPoint, "Insercion", extraerIdRegistro(result));
    }

    @AfterReturning(
            pointcut = "(execution(* pe.edu.aduniplus.backend..*Controller.actualizar*(..)) || @annotation(org.springframework.web.bind.annotation.PutMapping)) && !execution(* pe.edu.aduniplus.backend.auth.AuthController.*(..))",
            returning = "result"
    )
    public void logActualizacion(JoinPoint joinPoint, Object result) {
        registrarLog(joinPoint, "Modificacion", extraerIdRegistro(joinPoint));
    }

    @AfterReturning(
            pointcut = "(execution(* pe.edu.aduniplus.backend..*Controller.eliminar*(..)) || @annotation(org.springframework.web.bind.annotation.DeleteMapping)) && !execution(* pe.edu.aduniplus.backend.auth.AuthController.*(..))",
            returning = "result"
    )
    public void logEliminacion(JoinPoint joinPoint, Object result) {
        registrarLog(joinPoint, "Eliminacion", extraerIdRegistro(joinPoint));
    }

    private void registrarLog(JoinPoint joinPoint, String accion, Long idRegistro) {
        String usuario = obtenerUsuarioActual();
        String modulo = joinPoint.getTarget().getClass().getSimpleName().replace("Controller", "");
        String ip = obtenerIp();

        StringBuilder detalles = new StringBuilder();
        detalles.append("Metodo: ").append(joinPoint.getSignature().getName());
        detalles.append(" | Args: ").append(Arrays.toString(joinPoint.getArgs()));

        auditoriaService.registrarAccion(usuario, accion, modulo, idRegistro, ip, detalles.toString());
    }

    private Long extraerIdRegistro(JoinPoint joinPoint) {
        return Arrays.stream(joinPoint.getArgs())
            .filter(arg -> arg instanceof Long)
            .map(arg -> (Long) arg)
            .findFirst()
            .orElse(null);
    }

    private Long extraerIdRegistro(Object result) {
        if (result == null) return null;
        try {
            var method = result.getClass().getMethod("getId");
            Object id = method.invoke(result);
            return id instanceof Number ? ((Number) id).longValue() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private String obtenerUsuarioActual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
            return auth.getName();
        }
        return "SISTEMA";
    }

    private String obtenerIp() {
        try {
            HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
            String ip = request.getHeader("X-Forwarded-For");
            if (ip == null || ip.isBlank()) ip = request.getRemoteAddr();
            return ip;
        } catch (Exception e) {
            return null;
        }
    }
}
