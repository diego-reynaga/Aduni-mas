package pe.edu.aduniplus.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import pe.edu.aduniplus.backend.persona.Administrativo;
import pe.edu.aduniplus.backend.persona.AdministrativoRepository;
import pe.edu.aduniplus.backend.persona.Persona;
import pe.edu.aduniplus.backend.persona.PersonaRepository;
import pe.edu.aduniplus.backend.usuario.*;

import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder implements CommandLineRunner {

    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;
    private final AdministrativoRepository administrativoRepository;
    private final PersonaRepository personaRepository;
    private final PasswordEncoder passwordEncoder;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        log.info("Iniciando la inicialización de datos de la base de datos...");

        // 0. Limpiar roles inválidos o vacíos de la base de datos
        try {
            jdbcTemplate.execute("DELETE FROM usuario_rol WHERE rol_id IN (SELECT id FROM rol WHERE nombre IS NULL)");
            jdbcTemplate.execute("DELETE FROM rol WHERE nombre IS NULL");
            log.info("Limpieza de roles vacíos/inválidos completada.");
        } catch (Exception e) {
            log.warn("No se pudo realizar la limpieza de roles inválidos: {}", e.getMessage());
        }
        // 1. Inicializar roles
        for (RolNombre nombre : RolNombre.values()) {
            if (rolRepository.findByNombre(nombre).isEmpty()) {
                Rol nuevoRol = Rol.builder().nombre(nombre).build();
                rolRepository.save(nuevoRol);
                log.info("Rol creado: {}", nombre);
            }
        }

        // 2. Inicializar usuario administrador por defecto si no hay usuarios en el sistema
        if (usuarioRepository.count() == 0) {
            log.info("No se encontraron usuarios en el sistema. Creando administrador por defecto...");

            String documento = "00000000";
            Persona adminPersona;

            // Evitar problemas de documentos duplicados
            if (personaRepository.existsByDocumentoIdentidad(documento)) {
                log.warn("Ya existe una persona con el documento de identidad {}, se usará esa persona para el usuario admin.", documento);
                adminPersona = personaRepository.findByDocumentoIdentidad(documento)
                    .orElseThrow(() -> new RuntimeException("Error al recuperar persona existente"));
            } else {
                adminPersona = Administrativo.builder()
                    .nombres("Admin")
                    .apellidos("Sistema")
                    .documentoIdentidad(documento)
                    .correo("admin@aduniplus.edu.pe")
                    .codigoAdministrativo("ADM-001")
                    .cargo("Administrador")
                    .activo(true)
                    .build();
                adminPersona = administrativoRepository.save((Administrativo) adminPersona);
                log.info("Persona Administrativa de administrador creada con ID: {}", adminPersona.getId());
            }

            Rol rolAdmin = rolRepository.findByNombre(RolNombre.ADMINISTRADOR)
                .orElseThrow(() -> new RuntimeException("Rol ADMINISTRADOR no encontrado"));

            Usuario adminUsuario = Usuario.builder()
                .username("admin")
                .password(passwordEncoder.encode("Aduni1234!"))
                .persona(adminPersona)
                .roles(Set.of(rolAdmin))
                .activo(true)
                .build();

            usuarioRepository.save(adminUsuario);
            log.info("Usuario administrador por defecto creado exitosamente (username: admin, password: Aduni1234!)");
        } else {
            log.info("Ya existen usuarios registrados en el sistema. Se omite la creación del administrador por defecto.");
        }
    }
}
