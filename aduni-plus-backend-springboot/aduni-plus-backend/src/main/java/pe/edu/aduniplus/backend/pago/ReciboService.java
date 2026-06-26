package pe.edu.aduniplus.backend.pago;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.xhtmlrenderer.pdf.ITextRenderer;
import pe.edu.aduniplus.backend.institucion.ConfiguracionInstitucionalRepository;
import pe.edu.aduniplus.backend.institucion.ConfiguracionInstitucional;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReciboService {

    private final PagoRepository pagoRepository;
    private final ReciboRepository reciboRepository;
    private final ConfiguracionInstitucionalRepository configuracionInstitucionalRepository;

    @Value("${app.uploads.recibos:uploads/recibos/}")
    private String uploadsDir;

    @Transactional
    public PagoDtos.ReciboResponse generarRecibo(Long pagoId) throws Exception {
        Pago pago = pagoRepository.findById(pagoId).orElseThrow(() -> new IllegalArgumentException("Pago no encontrado"));
        if (pago.getReciboGenerado()) {
            throw new IllegalArgumentException("El pago ya tiene un recibo generado");
        }
        
        Optional<ConfiguracionInstitucional> configOpt = configuracionInstitucionalRepository.findAll().stream().findFirst();
        String institucionNombre = configOpt.map(ConfiguracionInstitucional::getNombre).orElse("Aduni+");
        String institucionRuc = configOpt.map(ConfiguracionInstitucional::getRuc).orElse("00000000000");

        String anio = String.valueOf(LocalDateTime.now().getYear());
        long count = reciboRepository.countByNumeroReciboStartingWith("REC-" + anio);
        String numeroRecibo = String.format("REC-%s-%05d", anio, count + 1);

        String estNombre = pago.getEstudiante().getNombres() + " " + pago.getEstudiante().getApellidos();
        String estCodigo = pago.getEstudiante().getCodigoEstudiante();

        String html = "<html><head><style>body { font-family: Arial, sans-serif; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; }</style></head><body>" +
                "<h1>RECIBO DE PAGO</h1>" +
                "<p><strong>Institución:</strong> " + institucionNombre + " (RUC: " + institucionRuc + ")</p>" +
                "<p><strong>Recibo Nro:</strong> " + numeroRecibo + "</p>" +
                "<p><strong>Fecha:</strong> " + LocalDateTime.now() + "</p>" +
                "<hr/>" +
                "<p><strong>Estudiante:</strong> " + estNombre + " (" + estCodigo + ")</p>" +
                "<p><strong>Método de Pago:</strong> " + pago.getMetodoPago() + "</p>" +
                "<p><strong>Concepto:</strong> " + (pago.getCuota() != null ? pago.getCuota().getConceptoCobro().getNombre() : "Pago Libre") + "</p>" +
                "<br/>" +
                "<table><tr><th>Descripción</th><th>Monto</th></tr>" +
                "<tr><td>Pago registrado</td><td>S/ " + pago.getMontoPagado() + "</td></tr>" +
                "</table>" +
                "<br/><br/><p><em>Gracias por su pago.</em></p>" +
                "</body></html>";

        File dir = new File(uploadsDir);
        if (!dir.exists()) dir.mkdirs();
        
        String filename = numeroRecibo + "_" + UUID.randomUUID().toString() + ".pdf";
        Path path = Paths.get(uploadsDir, filename);

        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            ITextRenderer renderer = new ITextRenderer();
            renderer.setDocumentFromString(html);
            renderer.layout();
            renderer.createPDF(os);

            try (FileOutputStream fos = new FileOutputStream(path.toFile())) {
                fos.write(os.toByteArray());
            }
        }

        Recibo recibo = new Recibo();
        recibo.setPago(pago);
        recibo.setNumeroRecibo(numeroRecibo);
        recibo.setMonto(pago.getMontoPagado());
        recibo.setFechaEmision(LocalDateTime.now());
        recibo.setRutaPdf(path.toString());
        
        Recibo saved = reciboRepository.save(recibo);
        
        pago.setReciboGenerado(true);
        pagoRepository.save(pago);

        return new PagoDtos.ReciboResponse(
                saved.getId(),
                saved.getPago().getId(),
                saved.getNumeroRecibo(),
                saved.getMonto(),
                saved.getFechaEmision(),
                saved.getRutaPdf()
        );
    }

    public byte[] obtenerPdf(Long reciboId) throws IOException {
        Recibo recibo = reciboRepository.findById(reciboId).orElseThrow(() -> new IllegalArgumentException("Recibo no encontrado"));
        Path path = Paths.get(recibo.getRutaPdf());
        if (!Files.exists(path)) {
            throw new IllegalArgumentException("El archivo PDF no existe");
        }
        return Files.readAllBytes(path);
    }
}
