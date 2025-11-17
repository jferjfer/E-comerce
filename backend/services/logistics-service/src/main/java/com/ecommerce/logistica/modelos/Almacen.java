package com.ecommerce.logistica.modelos;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "almacen")
public class Almacen {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @Column(nullable = false)
    private String nombre;
    
    @Column(name = "zona_geografica", nullable = false)
    private String zonaGeografica;
    
    private String direccion;
    
    @Column(name = "capacidad_maxima")
    private Integer capacidadMaxima;
    
    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;
    
    @OneToMany(mappedBy = "almacen", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<UbicacionStock> ubicacionesStock;
    
    @PrePersist
    protected void onCreate() {
        fechaCreacion = LocalDateTime.now();
    }
    
    // Getters y Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    
    public String getZonaGeografica() { return zonaGeografica; }
    public void setZonaGeografica(String zonaGeografica) { this.zonaGeografica = zonaGeografica; }
    
    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }
    
    public Integer getCapacidadMaxima() { return capacidadMaxima; }
    public void setCapacidadMaxima(Integer capacidadMaxima) { this.capacidadMaxima = capacidadMaxima; }
    
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    
    public List<UbicacionStock> getUbicacionesStock() { return ubicacionesStock; }
    public void setUbicacionesStock(List<UbicacionStock> ubicacionesStock) { this.ubicacionesStock = ubicacionesStock; }
}