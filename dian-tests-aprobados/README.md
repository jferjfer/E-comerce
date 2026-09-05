# DIAN - Sets de Pruebas Aprobados

## Set 1 - Aprobado 30/05/2026
- **Software ID:** a474896f-e364-4f09-bf6a-bc4c30e73ca9 (EGOS Facturacion)
- **TestSetId:** c537ef0b-2eb6-4149-9296-36d19e743ae2
- **Clave técnica:** fc8eac422eba16e22ffd8c6f94b3f40a6e38162c
- **PIN:** 13251

## Set 2 - Aprobado 31/05/2026 ✅ ACTUAL
- **Software ID:** b7c10167-446d-43cb-9978-9c30195f0074 (Facturacion EGOS)
- **TestSetId:** 8f493ed8-968c-44f3-bee6-fb2c54b4781e
- **Clave técnica:** fc8eac422eba16e22ffd8c6f94b3f40a6e38162c
- **PIN:** 14808
- **Resolución:** 18760000001
- **Prefijo:** SETP
- **Rango:** 990000000 - 995000000
- **Fecha desde:** 2019-01-19
- **Fecha hasta:** 2030-01-19
- **Ambiente habilitación:** 2

## Configuración XML que funciona

### Factura (consumidor final)
- CustomizationID: 10
- ProfileID: "DIAN 2.1: Factura Electrónica de Venta"
- AdditionalAccountID cliente: 2
- PartyIdentification cliente: antes de PartyName
- CompanyID cliente: schemeName="13" (sin schemeID)
- TaxScheme cliente: ZY / No aplica
- Sin TaxLevelCode en cliente
- NIT adquiriente: 2222222222 (10 dígitos)
- TaxTotal: solo IVA (01) - sin INC ni ICA
- CUFE: SHA384(Note) con ambiente en la cadena

### Nota Crédito
- CustomizationID: 20
- ProfileID: "DIAN 2.1: Nota Crédito de Factura Electrónica de Venta"
- Cliente AdditionalAccountID: 1 con PhysicalLocation + PartyLegalEntity + Contact

### Nota Débito  
- CustomizationID: 20
- ProfileID: "DIAN 2.1: Nota Débito de Factura Electrónica de Venta"
- RequestedMonetaryTotal (no LegalMonetaryTotal)

### Fechas del set de pruebas
- Facturas: 2019-03-15 a 2019-05-20
- Notas crédito: 2019-03-16 a 2019-06-11
- Notas débito: 2019-03-17 a 2019-06-12
