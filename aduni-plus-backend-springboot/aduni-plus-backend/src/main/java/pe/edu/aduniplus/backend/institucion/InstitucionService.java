package pe.edu.aduniplus.backend.institucion;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import pe.edu.aduniplus.backend.institucion.InstitucionDtos.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InstitucionService {

    private final ConfiguracionInstitucionalRepository repository;
    private static final String CODIGO_PRINCIPAL = "PRINCIPAL";
    
    // Directorio donde se guardaran las imagenes subidas
    private final Path fileStorageLocation = Paths.get("uploads").toAbsolutePath().normalize();

    @Transactional(readOnly = true)
    public ConfiguracionResponse getConfiguracion() {
        ConfiguracionInstitucional config = repository.findByCodigo(CODIGO_PRINCIPAL)
            .orElseGet(() -> {
                ConfiguracionInstitucional nueva = new ConfiguracionInstitucional();
                nueva.setCodigo(CODIGO_PRINCIPAL);
                nueva.setNombre("Aduni+ Institución Educativa");
                return repository.save(nueva);
            });
        return toResponse(config);
    }

    @Transactional
    public ConfiguracionResponse actualizarConfiguracion(ConfiguracionRequest request) {
        ConfiguracionInstitucional config = repository.findByCodigo(CODIGO_PRINCIPAL)
            .orElseThrow(() -> new RuntimeException("Configuración principal no encontrada"));

        config.setNombre(request.nombre());
        config.setDireccion(request.direccion());
        config.setTelefono(request.telefono());
        config.setCorreoInstitucional(request.correoInstitucional());
        config.setRuc(request.ruc());
        config.setSitioWeb(request.sitioWeb());
        
        // Solo actualizamos el logoUrl si viene algo en el request, 
        // normalmente la URL del logo se actualiza vía el endpoint de upload
        if (request.logoUrl() != null && !request.logoUrl().isBlank()) {
            config.setLogoUrl(request.logoUrl());
        }

        return toResponse(repository.save(config));
    }

    @Transactional
    public String uploadLogo(MultipartFile file) {
        try {
            Files.createDirectories(this.fileStorageLocation);
            
            // Generar un nombre único para evitar colisiones
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path targetLocation = this.fileStorageLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation);
            
            // Construimos la URL relativa que el frontend usara
            // Para esto Spring Boot necesita estar configurado para servir estaticos desde /uploads
            String fileDownloadUri = "/uploads/" + fileName;
            
            // Actualizamos en BD
            ConfiguracionInstitucional config = repository.findByCodigo(CODIGO_PRINCIPAL)
                .orElseThrow(() -> new RuntimeException("Configuración no encontrada"));
            config.setLogoUrl(fileDownloadUri);
            repository.save(config);
            
            return fileDownloadUri;
        } catch (IOException ex) {
            throw new RuntimeException("No se pudo guardar el archivo: " + ex.getMessage(), ex);
        }
    }

    private ConfiguracionResponse toResponse(ConfiguracionInstitucional config) {
        return new ConfiguracionResponse(
            config.getId(),
            config.getCodigo(),
            config.getNombre(),
            config.getLogoUrl(),
            config.getDireccion(),
            config.getTelefono(),
            config.getCorreoInstitucional(),
            config.getRuc(),
            config.getSitioWeb()
        );
    }
}
