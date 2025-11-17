package com.ecommerce.credito.dto;

import com.ecommerce.credito.modelos.CreditoInterno;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class CreditoResponse {
    private UUID id;
    private UUID idUsuario;
    private BigDecimal limiteCredito;
    private BigDecimal saldoUsado;
    private BigDecimal saldoDisponible;
    private String estado;
    private LocalDateTime fechaAprobacion;
    
    public CreditoResponse() {}
    
    public CreditoResponse(CreditoInterno credito) {
        this.id = credito.getId();
        this.idUsuario = credito.getIdUsuario();
        this.limiteCredito = credito.getLimiteCredito();
        this.saldoUsado = credito.getSaldoUsado();
        this.saldoDisponible = credito.getSaldoDisponible();
        this.estado = credito.getEstado().name();
        this.fechaAprobacion = credito.getFechaAprobacion();
    }
    
    // Getters y Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    
    public UUID getIdUsuario() { return idUsuario; }
    public void setIdUsuario(UUID idUsuario) { this.idUsuario = idUsuario; }
    
    public BigDecimal getLimiteCredito() { return limiteCredito; }
    public void setLimiteCredito(BigDecimal limiteCredito) { this.limiteCredito = limiteCredito; }
    
    public BigDecimal getSaldoUsado() { return saldoUsado; }
    public void setSaldoUsado(BigDecimal saldoUsado) { this.saldoUsado = saldoUsado; }
    
    public BigDecimal getSaldoDisponible() { return saldoDisponible; }
    public void setSaldoDisponible(BigDecimal saldoDisponible) { this.saldoDisponible = saldoDisponible; }
    
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    
    public LocalDateTime getFechaAprobacion() { return fechaAprobacion; }
    public void setFechaAprobacion(LocalDateTime fechaAprobacion) { this.fechaAprobacion = fechaAprobacion; }
}