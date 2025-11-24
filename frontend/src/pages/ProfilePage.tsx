import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { userPreferencesSchema, UserPreferencesForm } from '@/utils/validation'
import { useUserStore } from '@/store/useUserStore'

export default function ProfilePage() {
  const { user, setUser } = useUserStore()
  
  const { register, handleSubmit, formState: { errors } } = useForm<UserPreferencesForm>({
    resolver: zodResolver(userPreferencesSchema),
    defaultValues: user?.preferences
  })
  
  const onSubmit = (data: UserPreferencesForm) => {
    if (user) {
      setUser({
        ...user,
        preferences: data
      })
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-bold text-primary mb-6">Mi Perfil</h1>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Estilo Preferido</label>
              <select 
                {...register('style')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Selecciona un estilo</option>
                <option value="casual">Casual</option>
                <option value="elegante">Elegante</option>
                <option value="deportivo">Deportivo</option>
                <option value="bohemio">Bohemio</option>
              </select>
              {errors.style && (
                <p className="text-red-500 text-sm mt-1">{errors.style.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Talla</label>
              <select 
                {...register('size')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Selecciona tu talla</option>
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
              </select>
              {errors.size && (
                <p className="text-red-500 text-sm mt-1">{errors.size.message}</p>
              )}
            </div>
            
            <button 
              type="submit"
              className="w-full bg-primary text-white py-3 rounded-lg hover:bg-secondary transition-colors"
            >
              Guardar Preferencias
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}