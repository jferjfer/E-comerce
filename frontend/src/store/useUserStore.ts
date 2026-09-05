import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'

interface UserStore {
  user: User | null
  favorites: string[]
  setUser: (user: User) => void
  logout: () => void
  addToFavorites: (productId: string) => void
  removeFromFavorites: (productId: string) => void
  isFavorite: (productId: string) => boolean
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      favorites: [],
      
      setUser: (user: User) => set({ user }),
      
      logout: () => set({ user: null, favorites: [] }),
      
      addToFavorites: (productId: string) => {
        const favorites = get().favorites
        if (!favorites.includes(productId)) {
          set({ favorites: [...favorites, productId] })
          console.log(`❤️ Producto ${productId} agregado a favoritos. Total: ${favorites.length + 1}`)
        }
      },
      
      removeFromFavorites: (productId: string) => {
        const newFavorites = get().favorites.filter(id => id !== productId)
        set({ favorites: newFavorites })
        console.log(`💔 Producto ${productId} eliminado de favoritos. Total: ${newFavorites.length}`)
      },
      
      isFavorite: (productId: string) => {
        return get().favorites.includes(productId)
      }
    }),
    {
      name: 'user-storage'
    }
  )
)