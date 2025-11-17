package com.ecommerce.credito;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.*;

@SpringBootApplication
@RestController
public class ServicioCreditoApplication {

    public static void main(String[] args) {
        SpringApplication.run(ServicioCreditoApplication.class, args);
    }

    @GetMapping("/salud")
    public Map<String, Object> salud() {
        Map<String, Object> response = new HashMap<>();
        response.put("estado", "activo");
        response.put("servicio", "credito");
        response.put("timestamp", new Date().toString());
        return response;
    }

    @GetMapping("/api/credito/{usuarioId}")
    public Map<String, Object> obtenerCredito(@PathVariable String usuarioId) {
        Map<String, Object> response = new HashMap<>();
        response.put("usuario_id", usuarioId);
        response.put("limite_credito", 1000.00);
        response.put("credito_disponible", 750.00);
        response.put("tasa_interes", 12.5);
        response.put("estado", "activo");
        return response;
    }

    @PostMapping("/api/credito/solicitar")
    public Map<String, Object> solicitarCredito(@RequestBody Map<String, Object> datos) {
        Map<String, Object> response = new HashMap<>();
        response.put("mensaje", "Solicitud de crédito procesada");
        response.put("monto_solicitado", datos.get("monto"));
        response.put("estado", "aprobado");
        response.put("numero_solicitud", "CRED-" + System.currentTimeMillis());
        return response;
    }
}