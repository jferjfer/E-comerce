package com.ecommerce.logistica.controladores;

import com.ecommerce.logistica.dto.StockResponse;
import com.ecommerce.logistica.modelos.UbicacionStock;
import com.ecommerce.logistica.servicios.ServicioInventario;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/inventario")
@CrossOrigin(origins = "*")
public class ControladorInventario {
    
    @Autowired
    private ServicioInventario servicioInventario;
    
    @GetMapping("/producto/{idProducto}/stock")
    public ResponseEntity<?> consultarStockProducto(@PathVariable UUID idProducto) {
        try {
            Integer stockTotal = servicioInventario.consultarStockProducto(idProducto);
            List<UbicacionStock> stockPorAlmacen = servicioInventario.consultarStockPorAlmacen(idProducto);
            
            List<StockResponse> stockResponse = stockPorAlmacen.stream()
                .map(StockResponse::new)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Stock consultado exitosamente",
                "stock_total", stockTotal,
                "stock_por_almacen", stockResponse
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage()
            ));
        }
    }
    
    @PostMapping("/producto/{idProducto}/verificar")
    public ResponseEntity<?> verificarDisponibilidad(
        @PathVariable UUID idProducto,
        @RequestBody Map<String, Integer> request
    ) {
        try {
            Integer cantidadRequerida = request.get("cantidad");
            boolean disponible = servicioInventario.verificarDisponibilidad(idProducto, cantidadRequerida);
            Integer stockActual = servicioInventario.consultarStockProducto(idProducto);
            
            return ResponseEntity.ok(Map.of(
                "disponible", disponible,
                "stock_actual", stockActual,
                "cantidad_requerida", cantidadRequerida
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage()
            ));
        }
    }
    
    @PostMapping("/producto/{idProducto}/reservar")
    public ResponseEntity<?> reservarStock(
        @PathVariable UUID idProducto,
        @RequestBody Map<String, Integer> request
    ) {
        try {
            Integer cantidad = request.get("cantidad");
            UbicacionStock stockReservado = servicioInventario.reservarStock(idProducto, cantidad);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Stock reservado exitosamente",
                "datos", new StockResponse(stockReservado)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage()
            ));
        }
    }
    
    @PutMapping("/almacen/{idAlmacen}/producto/{idProducto}")
    public ResponseEntity<?> actualizarStock(
        @PathVariable UUID idAlmacen,
        @PathVariable UUID idProducto,
        @RequestBody Map<String, Integer> request
    ) {
        try {
            Integer nuevaCantidad = request.get("cantidad");
            UbicacionStock stockActualizado = servicioInventario.actualizarStock(idAlmacen, idProducto, nuevaCantidad);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Stock actualizado exitosamente",
                "datos", new StockResponse(stockActualizado)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage()
            ));
        }
    }
    
    @GetMapping("/stock-bajo")
    public ResponseEntity<?> obtenerProductosConStockBajo() {
        try {
            List<UbicacionStock> productosStockBajo = servicioInventario.obtenerProductosConStockBajo();
            List<StockResponse> response = productosStockBajo.stream()
                .map(StockResponse::new)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Productos con stock bajo obtenidos exitosamente",
                "datos", response,
                "total", response.size()
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
            "servicio", "logistica",
            "timestamp", java.time.LocalDateTime.now().toString()
        ));
    }
}