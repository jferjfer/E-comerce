package com.ecommerce.logistica.modelos;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ubicacion_stock", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"id_almacen", "id_producto"})
})
public class UbicacionStock {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @Column(name = "id_almacen", nullable = false)
    private UUID idAlmacen;
    
    @Column(name = "id_producto", nullable = false)
    private UUID idProducto;
    
    @Column(nullable = false)
    private Integer cantidad = 0;
    
    @Column(name = "stock_minimo", nullable = false)
    private Integer stockMinimo = 10;
    
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_almacen", insertable = false, updatable = false)
    private Almacen almacen;
    
    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        fechaActualizacion = LocalDateTime.now();
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
    
    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    
    public Almacen getAlmacen() { return almacen; }
    public void setAlmacen(Almacen almacen) { this.almacen = almacen; }
    
    public boolean necesitaReposicion() {
        return cantidad <= stockMinimo;
    }
}