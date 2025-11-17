package com.ecommerce.logistica.repositorios;

import com.ecommerce.logistica.modelos.UbicacionStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UbicacionStockRepository extends JpaRepository<UbicacionStock, UUID> {
    
    List<UbicacionStock> findByIdProducto(UUID idProducto);
    
    List<UbicacionStock> findByIdAlmacen(UUID idAlmacen);
    
    Optional<UbicacionStock> findByIdAlmacenAndIdProducto(UUID idAlmacen, UUID idProducto);
    
    @Query("SELECT u FROM UbicacionStock u WHERE u.cantidad <= u.stockMinimo")
    List<UbicacionStock> findProductosConStockBajo();
    
    @Query("SELECT SUM(u.cantidad) FROM UbicacionStock u WHERE u.idProducto = :idProducto")
    Integer obtenerStockTotalProducto(@Param("idProducto") UUID idProducto);
    
    @Query("SELECT u FROM UbicacionStock u WHERE u.idProducto = :idProducto AND u.cantidad > 0 ORDER BY u.cantidad DESC")
    List<UbicacionStock> findAlmacenesConStock(@Param("idProducto") UUID idProducto);
}