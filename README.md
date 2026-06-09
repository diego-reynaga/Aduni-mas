# SoftEscolar - Documentación del Proyecto

## Instalación de Spring Boot (Backend)

### Prerrequisitos
- **Java 17** o superior instalado
- **Maven 3.8+** o **Gradle 7+**
- **IDE** recomendado: IntelliJ IDEA, VS Code o Eclipse

### Pasos para instalar y ejecutar el backend

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd SoftEscolar/aduni-plus-backend-springboot
   ```

2. **Verificar versión de Java**
   ```bash
   java -version
   # Debe mostrar Java 17 o superior
   ```

3. **Verificar Maven/Gradle**
   ```bash
   mvn -version
   # O si usa Gradle:
   gradle -version
   ```

4. **Configurar base de datos**
   - Crear base de datos MySQL/PostgreSQL
   - Actualizar `src/main/resources/application.properties` o `application.yml` con sus credenciales

5. **Compilar el proyecto**
   ```bash
   # Con Maven
   mvn clean install

   # Con Gradle
   gradle build
   ```

6. **Ejecutar la aplicación**
   ```bash
   # Con Maven
   mvn spring-boot:run

   # Con Gradle
   gradle bootRun

   # O ejecutar el JAR generado
   java -jar target/*.jar
   ```

7. **Verificar que funciona**
   - La API estará disponible en: `http://localhost:8080`
   - Swagger UI (si está configurado): `http://localhost:8080/swagger-ui.html`

---

## Credenciales de Prueba

| Rol | Usuario | Contraseña |
|-----|---------|------------|
| Administrador | `admin.aduni` | `Aduni1234!` |
| Docente | `docente.algebra` | `Aduni1234!` |
| Estudiante | `estudiante.camila` | `Aduni1234!` |
| Estudiante | `estudiante.diego` | `Aduni1234!` |
| Padre | `padre.rojas` | `Aduni1234!` |

---

## Estructura del Proyecto

```
SoftEscolar/
├── aduni-plus-backend-springboot/   # Backend Spring Boot
├── frontend/                         # Frontend (React/Vue/Angular)
└── README.md                         # Este archivo
```

## Comandos Útiles

```bash
# Ejecutar tests
mvn test

# Limpiar y compilar
mvn clean package

# Ejecutar en modo desarrollo con hot reload
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

## Solución de Problemas Comunes

- **Puerto 8080 ocupado**: Cambiar `server.port` en `application.properties`
- **Error de conexión a BD**: Verificar credenciales y que el servicio de BD esté corriendo
- **Dependencias no resueltas**: Ejecutar `mvn dependency:resolve` o `gradle dependencies`