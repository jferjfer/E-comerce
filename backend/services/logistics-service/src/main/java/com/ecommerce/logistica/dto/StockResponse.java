package com.ecommerce.logistica.dto;

import com.ecommerce.logistica.modelos.UbicacionStock;
import java.time.LocalDateTime;
import java.util.UUID;

public class StockResponse {
    private UUID id;
    private UUID idAlmacen;
    private UUID idProducto;
    private Integer cantidad;
    private Integer stockMinimo;
    private boolean necesitaReposicion;
    private LocalDateTime fechaActualizacion;
    private String nombreAlmacen;
    
    public StockResponse() {}
    
    public StockResponse(UbicacionStock ubicacion) {
        this.id = ubicacion.getId();
        this.idAlmacen = ubicacion.getIdAlmacen();
        this.idProducto = ubicacion.getIdProducto();
        this.cantidad = ubicacion.getCantidad();
        this.stockMinimo = ubicacion.getStockMinimo();
        this.necesitaReposicion = ubicacion.necesitaReposicion();
        this.fechaActualizacion = ubicacion.getFechaActualizacion();
        this.nombreAlmacen = ubicacion.getAlmacen() != null ? ubicacion.getAlmacen().getNombre() : null;
    }
    
    // Getters y Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    
    public UUID getIdAlmacen() { return idAlmacen; }
    public void setIdAlmacen(UUID idAlmacen) { this.idAlmacen = idAlmacen; }
    
    public UUID getIdProducto() { return idProducto; }
    public void setIdProducto(UUID idProducto) { this.idProducto = idProducto; }
    
    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }
    
    public Integer getStockMinimo() { return stockMinimo; }
    public void setStockMinimo(Integer stockMinimo) { this.stockMinimo = stockMinimo; }
    
    public boolean isNecesitaReposicion() { return necesitaReposicion; }
    public void setNecesitaReposicion(boolean necesitaReposicion) { this.necesitaReposicion = necesitaReposicion; }
    
    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) { this.fechaActualizacion = fechaActualizacion; }
    
    public String getNombreAlmacen() { return nombreAlmacen; }
    public void setNombreAlmacen(String nombreAlmacen) { this.nombreAlmacen = nombreAlmacen; }
}