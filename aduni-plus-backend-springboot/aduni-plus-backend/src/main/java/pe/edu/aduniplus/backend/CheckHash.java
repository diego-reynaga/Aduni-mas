package pe.edu.aduniplus.backend;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
public class CheckHash {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        System.out.println(encoder.encode("admin123"));
    }
}
