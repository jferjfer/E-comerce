package com.ecommerce.credito.controladores;

import com.ecommerce.credito.dto.CreditoResponse;
import com.ecommerce.credito.modelos.CreditoInterno;
import com.ecommerce.credito.servicios.ServicioCredito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/credito")
@CrossOrigin(origins = "*")
public class ControladorCredito {
    
    @Autowired
    private ServicioCredito servicioCredito;
    
    @PostMapping("/evaluar")
    public ResponseEntity<?> evaluarCredito(@RequestBody Map<String, Object> request) {
        try {
            UUID idUsuario = UUID.fromString((String) request.get("id_usuario"));
            BigDecimal totalCompras = new BigDecimal(request.get("total_compras_historico").toString());
            
            CreditoInterno credito = servicioCredito.evaluarYCrearCredito(idUsuario, totalCompras);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Crédito evaluado y aprobado exitosamente",
                "datos", new CreditoResponse(credito)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage()
            ));
        }
    }
    
    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<?> obtenerCreditoUsuario(@PathVariable UUID idUsuario) {
        try {
            return servicioCredito.obtenerCreditoPorUsuario(idUsuario)
                .map(credito -> ResponseEntity.ok(Map.of(
                    "mensaje", "Crédito obtenido exitosamente",
                    "datos", new CreditoResponse(credito)
                )))
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage()
            ));
        }
    }
    
    @PostMapping("/usar")
    public ResponseEntity<?> usarCredito(@RequestBody Map<String, Object> request) {
        try {
            UUID idUsuario = UUID.fromString((String) request.get("id_usuario"));
            BigDecimal monto = new BigDecimal(request.get("monto").toString());
            
            CreditoInterno credito = servicioCredito.usarCredito(idUsuario, monto);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Crédito utilizado exitosamente",
                "datos", new CreditoResponse(credito)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage()
            ));
        }
    }
    
    @PostMapping("/pagar")
    public ResponseEntity<?> pagarCredito(@RequestBody Map<String, Object> request) {
        try {
            UUID idUsuario = UUID.fromString((String) request.get("id_usuario"));
            BigDecimal monto = new BigDecimal(request.get("monto").toString());
            
            CreditoInterno credito = servicioCredito.pagarCredito(idUsuario, monto);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Pago de crédito procesado exitosamente",
                "datos", new CreditoResponse(credito)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage()
            ));
        }
    }
    
    @GetMapping("/salud")
    public ResponseEntity<Map<String, Object>> verificarSalud() {
        return ResponseEntity.ok(Map.of(
            "estado", "activo",
            "servicio", "credito",
            "timestamp", java.time.LocalDateTime.now().toString()
        ));
    }
}