package pe.edu.aduniplus.backend.pago;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.aduniplus.backend.academico.GestionAcademicaRepository;
import pe.edu.aduniplus.backend.persona.EstudianteRepository;
import pe.edu.aduniplus.backend.academico.MatriculaRepository;
import pe.edu.aduniplus.backend.usuario.UsuarioRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PagoService {

    private final ConceptoCobroRepository conceptoCobroRepository;
    private final CronogramaPagoRepository cronogramaPagoRepository;
    private final CuotaRepository cuotaRepository;
    private final PagoRepository pagoRepository;
    private final ReciboRepository reciboRepository;
    
    private final EstudianteRepository estudianteRepository;
    private final MatriculaRepository matriculaRepository;
    private final GestionAcademicaRepository gestionAcademicaRepository;
    private final UsuarioRepository usuarioRepository;

    // --- Conceptos ---
    @Transactional(readOnly = true)
    public List<PagoDtos.ConceptoCobroResponse> listarConceptos() {
        return conceptoCobroRepository.findAll().stream()
                .map(this::mapConcepto)
                .collect(Collectors.toList());
    }

    @Transactional
    public PagoDtos.ConceptoCobroResponse crearConcepto(PagoDtos.ConceptoCobroRequest req) {
        if (conceptoCobroRepository.existsByCodigo(req.codigo())) {
            throw new IllegalArgumentException("Ya existe un concepto con el código: " + req.codigo());
        }
        ConceptoCobro concepto = new ConceptoCobro();
        concepto.setCodigo(req.codigo());
        concepto.setNombre(req.nombre());
        concepto.setDescripcion(req.descripcion());
        concepto.setActivo(req.activo() != null ? req.activo() : true);
        
        return mapConcepto(conceptoCobroRepository.save(concepto));
    }

    @Transactional
    public PagoDtos.ConceptoCobroResponse actualizarConcepto(Long id, PagoDtos.ConceptoCobroRequest req) {
        ConceptoCobro concepto = conceptoCobroRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Concepto no encontrado"));
                
        if (!concepto.getCodigo().equals(req.codigo()) && conceptoCobroRepository.existsByCodigo(req.codigo())) {
            throw new IllegalArgumentException("Ya existe un concepto con el código: " + req.codigo());
        }
        
        concepto.setCodigo(req.codigo());
        concepto.setNombre(req.nombre());
        concepto.setDescripcion(req.descripcion());
        if (req.activo() != null) concepto.setActivo(req.activo());
        
        return mapConcepto(conceptoCobroRepository.save(concepto));
    }

    // --- Cronogramas ---
    @Transactional
    public PagoDtos.CronogramaResponse crearCronograma(PagoDtos.CronogramaRequest req, Long usuarioId) {
        CronogramaPago cronograma = new CronogramaPago();
        cronograma.setEstudiante(estudianteRepository.findById(req.estudianteId())
                .orElseThrow(() -> new IllegalArgumentException("Estudiante no encontrado")));
                
        if (req.matriculaId() != null) {
            cronograma.setMatricula(matriculaRepository.findById(req.matriculaId()).orElse(null));
        }
        if (req.gestionAcademicaId() != null) {
            cronograma.setGestionAcademica(gestionAcademicaRepository.findById(req.gestionAcademicaId()).orElse(null));
        }
        cronograma.setUsuarioCreacion(usuarioRepository.findById(usuarioId).orElseThrow());
        
        cronograma.setTotalCuotas(req.cuotas().size());
        cronograma.setMontoTotal(req.cuotas().stream().map(PagoDtos.CuotaProgramadaRequest::montoProgramado).reduce(BigDecimal.ZERO, BigDecimal::add));
        cronograma.setObservacion(req.observacion());
        cronograma.setActivo(true);
        
        CronogramaPago saved = cronogramaPagoRepository.save(cronograma);
        
        for (PagoDtos.CuotaProgramadaRequest c : req.cuotas()) {
            Cuota cuota = new Cuota();
            cuota.setCronograma(saved);
            cuota.setNumeroCuota(c.numeroCuota());
            cuota.setConceptoCobro(conceptoCobroRepository.findById(c.conceptoCobroId()).orElseThrow());
            cuota.setFechaVencimiento(c.fechaVencimiento());
            cuota.setMontoProgramado(c.montoProgramado());
            cuota.setSaldoPendiente(c.montoProgramado());
            cuota.setEstado(EstadoCuota.PENDIENTE);
            cuotaRepository.save(cuota);
        }
        
        return obtenerCronograma(saved.getId());
    }

    @Transactional(readOnly = true)
    public List<PagoDtos.CronogramaResponse> listarCronogramas(Long gestionId, Long estudianteId) {
        List<CronogramaPago> list;
        if (estudianteId != null) {
            list = cronogramaPagoRepository.findByEstudianteIdOrderByCreadoEnDesc(estudianteId);
        } else if (gestionId != null) {
            list = cronogramaPagoRepository.findByGestionAcademicaId(gestionId);
        } else {
            list = cronogramaPagoRepository.findAll();
        }
        return list.stream().map(this::mapCronograma).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PagoDtos.CronogramaResponse obtenerCronograma(Long id) {
        CronogramaPago cronograma = cronogramaPagoRepository.findById(id).orElseThrow();
        return mapCronograma(cronograma);
    }
    
    @Transactional(readOnly = true)
    public List<PagoDtos.CronogramaResponse> listarCronogramasPorEstudiante(Long estudianteId) {
        return cronogramaPagoRepository.findByEstudianteIdOrderByCreadoEnDesc(estudianteId)
                .stream().map(this::mapCronograma).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PagoDtos.CuotaResponse> listarCuotasPorCronograma(Long cronogramaId) {
        return cuotaRepository.findByCronogramaIdOrderByNumeroCuotaAsc(cronogramaId)
                .stream().map(this::mapCuota).collect(Collectors.toList());
    }

    // --- Pagos ---
    @Transactional
    public PagoDtos.PagoResponse registrarPago(PagoDtos.PagoRequest req, Long usuarioId) {
        Pago pago = new Pago();
        pago.setEstudiante(estudianteRepository.findById(req.estudianteId()).orElseThrow());
        pago.setMontoPagado(req.montoPagado());
        pago.setFechaPago(req.fechaPago());
        pago.setMetodoPago(req.metodoPago());
        pago.setNumeroComprobante(req.numeroComprobante());
        pago.setObservacion(req.observacion());
        pago.setUsuarioRegistro(usuarioRepository.findById(usuarioId).orElseThrow());
        pago.setAnulado(false);
        pago.setReciboGenerado(false);

        if (req.cronogramaId() != null) {
            pago.setCronograma(cronogramaPagoRepository.findById(req.cronogramaId()).orElse(null));
        }

        if (req.cuotaId() != null) {
            Cuota cuota = cuotaRepository.findById(req.cuotaId()).orElseThrow();
            pago.setCuota(cuota);
            if (pago.getCronograma() == null) {
                pago.setCronograma(cuota.getCronograma());
            }
            
            BigDecimal nuevoSaldo = cuota.getSaldoPendiente().subtract(req.montoPagado());
            if (nuevoSaldo.compareTo(BigDecimal.ZERO) < 0) {
                nuevoSaldo = BigDecimal.ZERO;
            }
            cuota.setSaldoPendiente(nuevoSaldo);
            if (nuevoSaldo.compareTo(BigDecimal.ZERO) == 0) {
                cuota.setEstado(EstadoCuota.PAGADO);
            } else {
                cuota.setEstado(EstadoCuota.PARCIAL);
            }
            cuotaRepository.save(cuota);
        }

        Pago saved = pagoRepository.save(pago);
        return mapPago(saved);
    }

    @Transactional(readOnly = true)
    public List<PagoDtos.PagoResponse> listarPagos(Long estudianteId, LocalDate desde, LocalDate hasta, Boolean anulado) {
        List<Pago> pagos;
        if (estudianteId != null && desde != null && hasta != null) {
            pagos = pagoRepository.findByEstudianteIdAndFechaPagoBetween(estudianteId, desde, hasta);
        } else if (estudianteId != null) {
            pagos = pagoRepository.findByEstudianteIdOrderByFechaPagoDesc(estudianteId);
        } else if (desde != null && hasta != null) {
            pagos = pagoRepository.findByFechaPagoBetween(desde, hasta);
        } else {
            pagos = pagoRepository.findAll();
        }
        
        if (anulado != null) {
            pagos = pagos.stream().filter(p -> p.getAnulado().equals(anulado)).collect(Collectors.toList());
        }
        
        return pagos.stream().map(this::mapPago).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PagoDtos.PagoResponse obtenerPago(Long id) {
        return mapPago(pagoRepository.findById(id).orElseThrow());
    }

    @Transactional
    public PagoDtos.PagoResponse anularPago(Long id, String motivo) {
        Pago pago = pagoRepository.findById(id).orElseThrow();
        if (pago.getAnulado()) {
            throw new IllegalArgumentException("El pago ya está anulado");
        }
        
        pago.setAnulado(true);
        pago.setMotivoAnulacion(motivo);
        pago.setFechaAnulacion(LocalDateTime.now());
        
        if (pago.getCuota() != null) {
            Cuota cuota = pago.getCuota();
            BigDecimal saldo = cuota.getSaldoPendiente().add(pago.getMontoPagado());
            cuota.setSaldoPendiente(saldo);
            if (cuota.getFechaVencimiento().isBefore(LocalDate.now())) {
                cuota.setEstado(EstadoCuota.VENCIDO);
            } else {
                cuota.setEstado(EstadoCuota.PENDIENTE);
            }
            // Si el saldo es menor que programado pero no cero, seria PARCIAL. Lo simplificamos a PENDIENTE/VENCIDO o PARCIAL.
            if (saldo.compareTo(cuota.getMontoProgramado()) < 0) {
                cuota.setEstado(EstadoCuota.PARCIAL);
            }
            cuotaRepository.save(cuota);
        }
        
        return mapPago(pagoRepository.save(pago));
    }

    // --- Mappers ---
    private PagoDtos.ConceptoCobroResponse mapConcepto(ConceptoCobro c) {
        return new PagoDtos.ConceptoCobroResponse(c.getId(), c.getCodigo(), c.getNombre(), c.getDescripcion(), c.getActivo());
    }

    private PagoDtos.CronogramaResponse mapCronograma(CronogramaPago c) {
        String estNombre = c.getEstudiante().getNombres() + " " + c.getEstudiante().getApellidos();
        String estCodigo = c.getEstudiante().getCodigoEstudiante();
        List<PagoDtos.CuotaResponse> cuotas = c.getCuotas().stream().map(this::mapCuota).collect(Collectors.toList());
        
        return new PagoDtos.CronogramaResponse(
                c.getId(),
                c.getEstudiante().getId(),
                estNombre,
                estCodigo,
                c.getMatricula() != null ? c.getMatricula().getId() : null,
                c.getGestionAcademica() != null ? c.getGestionAcademica().getId() : null,
                c.getTotalCuotas(),
                c.getMontoTotal(),
                c.getObservacion(),
                c.getActivo(),
                cuotas
        );
    }

    private PagoDtos.CuotaResponse mapCuota(Cuota c) {
        return new PagoDtos.CuotaResponse(
                c.getId(),
                c.getNumeroCuota(),
                c.getConceptoCobro().getId(),
                c.getConceptoCobro().getNombre(),
                c.getFechaVencimiento(),
                c.getMontoProgramado(),
                c.getSaldoPendiente(),
                c.getEstado().name()
        );
    }

    private PagoDtos.PagoResponse mapPago(Pago p) {
        String estNombre = p.getEstudiante().getNombres() + " " + p.getEstudiante().getApellidos();
        String estCodigo = p.getEstudiante().getCodigoEstudiante();
        
        String numeroRecibo = null;
        if (p.getReciboGenerado()) {
            Optional<Recibo> recibo = reciboRepository.findByPagoId(p.getId());
            if (recibo.isPresent()) {
                numeroRecibo = recibo.get().getNumeroRecibo();
            }
        }
        
        return new PagoDtos.PagoResponse(
                p.getId(),
                p.getCuota() != null ? p.getCuota().getId() : null,
                p.getCuota() != null ? p.getCuota().getNumeroCuota() : null,
                p.getCronograma() != null ? p.getCronograma().getId() : null,
                p.getEstudiante().getId(),
                estNombre,
                estCodigo,
                p.getMontoPagado(),
                p.getFechaPago(),
                p.getMetodoPago().name(),
                p.getNumeroComprobante(),
                p.getObservacion(),
                p.getAnulado(),
                p.getFechaAnulacion(),
                p.getMotivoAnulacion(),
                p.getReciboGenerado(),
                numeroRecibo
        );
    }
}
