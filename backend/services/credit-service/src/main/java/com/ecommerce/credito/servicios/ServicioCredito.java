package com.ecommerce.credito.servicios;

import com.ecommerce.credito.modelos.CreditoInterno;
import com.ecommerce.credito.repositorios.CreditoInternoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class ServicioCredito {
    
    @Autowired
    private CreditoInternoRepository creditoRepository;
    
    public CreditoInterno evaluarYCrearCredito(UUID idUsuario, BigDecimal totalComprasHistorico) {
        if (creditoRepository.existsByIdUsuario(idUsuario)) {
            throw new RuntimeException("El usuario ya tiene un crédito asignado");
        }
        
        BigDecimal limiteCredito = calcularLimiteCredito(totalComprasHistorico);
        
        CreditoInterno credito = new CreditoInterno();
        credito.setIdUsuario(idUsuario);
        credito.setLimiteCredito(limiteCredito);
        credito.setEstado(CreditoInterno.EstadoCredito.Aprobado);
        credito.setFechaAprobacion(LocalDateTime.now());
        
        return creditoRepository.save(credito);
    }
    
    public Optional<CreditoInterno> obtenerCreditoPorUsuario(UUID idUsuario) {
        return creditoRepository.findByIdUsuario(idUsuario);
    }
    
    public CreditoInterno usarCredito(UUID idUsuario, BigDecimal monto) {
        CreditoInterno credito = creditoRepository.findCreditoActivoPorUsuario(idUsuario)
            .orElseThrow(() -> new RuntimeException("No se encontró crédito activo para el usuario"));
        
        if (credito.getSaldoDisponible().compareTo(monto) < 0) {
            throw new RuntimeException("Saldo insuficiente en el crédito");
        }
        
        credito.setSaldoUsado(credito.getSaldoUsado().add(monto));
        return creditoRepository.save(credito);
    }
    
    public CreditoInterno pagarCredito(UUID idUsuario, BigDecimal monto) {
        CreditoInterno credito = creditoRepository.findByIdUsuario(idUsuario)
            .orElseThrow(() -> new RuntimeException("No se encontró crédito para el usuario"));
        
        BigDecimal nuevoSaldoUsado = credito.getSaldoUsado().subtract(monto);
        if (nuevoSaldoUsado.compareTo(BigDecimal.ZERO) < 0) {
            nuevoSaldoUsado = BigDecimal.ZERO;
        }
        
        credito.setSaldoUsado(nuevoSaldoUsado);
        return creditoRepository.save(credito);
    }
    
    private BigDecimal calcularLimiteCredito(BigDecimal totalComprasHistorico) {
        // Lógica simple: 30% del total de compras históricas, mínimo $100, máximo $5000
        BigDecimal limite = totalComprasHistorico.multiply(new BigDecimal("0.30"));
        
        if (limite.compareTo(new BigDecimal("100")) < 0) {
            return new BigDecimal("100");
        }
        
        if (limite.compareTo(new BigDecimal("5000")) > 0) {
            return new BigDecimal("5000");
        }
        
        return limite;
    }
}