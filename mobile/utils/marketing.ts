// Badges de oferta rotativos — cambian cada 8 horas
const BADGES = [
  { label: '30% OFF', color: 'bg-red-500', precioFactor: 1.43 },
  { label: '25% OFF', color: 'bg-orange-500', precioFactor: 1.33 },
  { label: '20% OFF', color: 'bg-pink-500', precioFactor: 1.25 },
  { label: 'OFERTA', color: 'bg-purple-600', precioFactor: 1.30 },
  { label: '15% OFF', color: 'bg-rose-500', precioFactor: 1.18 },
  null, // sin badge
  null, // sin badge
]

// Seed basado en el ID del producto + bloque de 8 horas actual
function getSeed(productoId: string): number {
  const bloque8h = Math.floor(Date.now() / (8 * 60 * 60 * 1000))
  const str = `${productoId}-${bloque8h}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function getBadgeOferta(productoId: string, precio: number) {
  const seed = getSeed(productoId)
  const badge = BADGES[seed % BADGES.length]
  if (!badge) return null
  const precioReferencia = Math.ceil(precio * badge.precioFactor / 1000) * 1000
  return {
    label: badge.label,
    color: badge.color,
    precioReferencia,
  }
}

// Orden rotativo de productos — cambia cada 3 horas (TEST: 1 minuto)
export function ordenarProductosRotativo<T extends { id: string }>(productos: T[]): T[] {
  const bloque3h = Math.floor(Date.now() / (1 * 60 * 1000)) // 1 minuto para pruebas
  return [...productos].sort((a, b) => {
    const seedA = Math.abs(hashStr(`${a.id}-${bloque3h}`))
    const seedB = Math.abs(hashStr(`${b.id}-${bloque3h}`))
    return seedA - seedB
  })
}

function hashStr(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return hash
}
