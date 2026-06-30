package pe.edu.aduniplus.backend.common;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ProblemDetail;
import org.springframework.web.context.request.WebRequest;
import java.time.Instant;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail handleIllegalArgument(IllegalArgumentException ex, WebRequest request) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        pd.setTitle("Bad Request");
        pd.setProperty("timestamp", Instant.now().toString());
        pd.setProperty("errorCode", "VALIDACION_ERROR");
        return pd;
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail handleDataIntegrity(DataIntegrityViolationException ex) {
        String msg = "Error de integridad de datos";
        String errorCode = "INTEGRIDAD_ERROR";
        if (ex.getMessage() != null) {
            if (ex.getMessage().contains("uk_personas_documento")) {
                msg = "El documento de identidad ya se encuentra registrado";
                errorCode = "DOCUMENTO_DUPLICADO";
            } else if (ex.getMessage().contains("uk_personas_correo")) {
                msg = "El correo electrónico ya se encuentra registrado";
                errorCode = "CORREO_DUPLICADO";
            }
        }
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, msg);
        pd.setTitle("Conflict");
        pd.setProperty("timestamp", Instant.now().toString());
        pd.setProperty("errorCode", errorCode);
        return pd;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(e -> errors.put(e.getField(), e.getDefaultMessage()));
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        pd.setTitle("Bad Request");
        pd.setDetail("Error de validación en los campos de entrada");
        pd.setProperty("timestamp", Instant.now().toString());
        pd.setProperty("errors", errors);
        return pd;
    }

    @ExceptionHandler(org.springframework.dao.OptimisticLockingFailureException.class)
    public ProblemDetail handleOptimisticLock(org.springframework.dao.OptimisticLockingFailureException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,
            "La operación no pudo completarse debido a un conflicto de concurrencia. " +
            "Es posible que el cupo se haya agotado. Por favor, intente nuevamente.");
        pd.setTitle("Conflict");
        pd.setProperty("timestamp", Instant.now().toString());
        pd.setProperty("errorCode", "CONCURRENCIA_CUPO");
        return pd;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleAllExceptions(Exception ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, 
            ex.getMessage() != null ? ex.getMessage() : ex.getClass().getName());
        pd.setTitle("Internal Server Error");
        pd.setProperty("timestamp", Instant.now().toString());
        pd.setProperty("errorCode", "UNKNOWN_ERROR");
        return pd;
    }
}
