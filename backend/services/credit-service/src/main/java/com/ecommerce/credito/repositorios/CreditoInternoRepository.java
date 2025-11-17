package com.ecommerce.credito.repositorios;

import com.ecommerce.credito.modelos.CreditoInterno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CreditoInternoRepository extends JpaRepository<CreditoInterno, UUID> {
    
    Optional<CreditoInterno> findByIdUsuario(UUID idUsuario);
    
    @Query("SELECT c FROM CreditoInterno c WHERE c.idUsuario = :idUsuario AND c.estado = 'Aprobado'")
    Optional<CreditoInterno> findCreditoActivoPorUsuario(@Param("idUsuario") UUID idUsuario);
    
    boolean existsByIdUsuario(UUID idUsuario);
}