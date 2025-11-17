package com.ecommerce.logistica;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.*;

@SpringBootApplication
@RestController
public class ServicioLogisticaApplication {

    public static void main(String[] args) {
        SpringApplication.run(ServicioLogisticaApplication.class, args);
    }

    @GetMapping("/salud")
    public Map<String, Object> salud() {
        Map<String, Object> response = new HashMap<>();
        response.put("estado", "activo");
        response.put("servicio", "logistica");
        response.put("timestamp", new Date().toString());
        return response;
    }

    @GetMapping("/api/inventario")
    public Map<String, Object> obtenerInventario() {
        Map<String, Object> response = new HashMap<>();
        List<Map<String, Object>> inventario = new ArrayList<>();
        
        Map<String, Object> item1 = new HashMap<>();
        item1.put("producto_id", "prod_001");
        item1.put("stock", 45);
        item1.put("almacen", "Madrid Central");
        inventario.add(item1);
        
        Map<String, Object> item2 = new HashMap<>();
        item2.put("producto_id", "prod_002");
        item2.put("stock", 120);
        item2.put("almacen", "Barcelona Norte");
        inventario.add(item2);
        
        response.put("inventario", inventario);
        return response;
    }

    @PostMapping("/api/inventario/actualizar")
    public Map<String, Object> actualizarInventario(@RequestBody Map<String, Object> datos) {
        Map<String, Object> response = new HashMap<>();
        response.put("mensaje", "Inventario actualizado");
        response.put("producto_id", datos.get("producto_id"));
        response.put("nuevo_stock", datos.get("stock"));
        return response;
    }
}