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
        }
      },
      
      removeFromFavorites: (productId: string) => {
        set({
          favorites: get().favorites.filter(id => id !== productId)
        })
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