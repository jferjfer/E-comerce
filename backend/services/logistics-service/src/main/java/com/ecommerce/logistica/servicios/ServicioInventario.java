package com.ecommerce.logistica.servicios;

import com.ecommerce.logistica.modelos.UbicacionStock;
import com.ecommerce.logistica.repositorios.UbicacionStockRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class ServicioInventario {
    
    @Autowired
    private UbicacionStockRepository stockRepository;
    
    public Integer consultarStockProducto(UUID idProducto) {
        Integer stockTotal = stockRepository.obtenerStockTotalProducto(idProducto);
        return stockTotal != null ? stockTotal : 0;
    }
    
    public List<UbicacionStock> consultarStockPorAlmacen(UUID idProducto) {
        return stockRepository.findByIdProducto(idProducto);
    }
    
    public boolean verificarDisponibilidad(UUID idProducto, Integer cantidadRequerida) {
        Integer stockDisponible = consultarStockProducto(idProducto);
        return stockDisponible >= cantidadRequerida;
    }
    
    public UbicacionStock reservarStock(UUID idProducto, Integer cantidad) {
        List<UbicacionStock> almacenesConStock = stockRepository.findAlmacenesConStock(idProducto);
        
        for (UbicacionStock ubicacion : almacenesConStock) {
            if (ubicacion.getCantidad() >= cantidad) {
                ubicacion.setCantidad(ubicacion.getCantidad() - cantidad);
                return stockRepository.save(ubicacion);
            }
        }
        
        throw new RuntimeException("Stock insuficiente para el producto: " + idProducto);
    }
    
    public UbicacionStock actualizarStock(UUID idAlmacen, UUID idProducto, Integer nuevaCantidad) {
        Optional<UbicacionStock> ubicacionOpt = stockRepository.findByIdAlmacenAndIdProducto(idAlmacen, idProducto);
        
        if (ubicacionOpt.isPresent()) {
            UbicacionStock ubicacion = ubicacionOpt.get();
            ubicacion.setCantidad(nuevaCantidad);
            return stockRepository.save(ubicacion);
        } else {
            UbicacionStock nuevaUbicacion = new UbicacionStock();
            nuevaUbicacion.setIdAlmacen(idAlmacen);
            nuevaUbicacion.setIdProducto(idProducto);
            nuevaUbicacion.setCantidad(nuevaCantidad);
            return stockRepository.save(nuevaUbicacion);
        }
    }
    
    public List<UbicacionStock> obtenerProductosConStockBajo() {
        return stockRepository.findProductosConStockBajo();
    }
    
    public UbicacionStock reabastecer(UUID idAlmacen, UUID idProducto, Integer cantidad) {
        Optional<UbicacionStock> ubicacionOpt = stockRepository.findByIdAlmacenAndIdProducto(idAlmacen, idProducto);
        
        if (ubicacionOpt.isPresent()) {
            UbicacionStock ubicacion = ubicacionOpt.get();
            ubicacion.setCantidad(ubicacion.getCantidad() + cantidad);
            return stockRepository.save(ubicacion);
        } else {
            throw new RuntimeException("No se encontró ubicación de stock para el producto en el almacén especificado");
        }
    }
}