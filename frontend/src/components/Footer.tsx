import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { newsletterSchema, NewsletterForm } from '@/utils/validation'

export default function Footer() {
  const [subscribed, setSubscribed] = useState(false)
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<NewsletterForm>({
    resolver: zodResolver(newsletterSchema)
  })

  const onSubmit = (data: NewsletterForm) => {
    console.log('Newsletter subscription:', data)
    setSubscribed(true)
    reset()
    
    setTimeout(() => setSubscribed(false), 3000)
  }

  return (
    <footer className="bg-slate-800 text-white py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <img 
                src="/logo.png" 
                alt="Estilo y Moda" 
                className="w-6 h-6 object-contain"
              />
              <h3 className="text-sm font-bold" style={{ fontFamily: 'Dancing Script, cursive' }}>Estilo y Moda</h3>
            </div>
            <p className="text-gray-400 text-xs mb-2">
              NIT: 900.123.456-7<br/>
              Bogotá, Colombia
            </p>
            <div className="flex space-x-2">
              <a href="https://instagram.com/estiloymodaco" className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center hover:bg-pink-600">
                <i className="fab fa-instagram text-xs"></i>
              </a>
              <a href="https://facebook.com/estiloymodaco" className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700">
                <i className="fab fa-facebook text-xs"></i>
              </a>
              <a href="https://tiktok.com/@estiloymodaco" className="w-6 h-6 bg-black rounded-full flex items-center justify-center hover:bg-gray-800">
                <i className="fab fa-tiktok text-xs"></i>
              </a>
              <a href="https://whatsapp.com/channel/estiloymodaco" className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600">
                <i className="fab fa-whatsapp text-xs"></i>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-xs font-semibold mb-2">Atención al Cliente</h4>
            <ul className="space-y-1 text-gray-400 text-xs">
              <li><i className="fas fa-phone mr-1"></i>+57 1 234-5678</li>
              <li><i className="fas fa-envelope mr-1"></i>hola@estiloymodaco.com</li>
              <li><i className="fas fa-clock mr-1"></i>Lun-Vie 8AM-6PM</li>
              <li><a href="#" className="hover:text-white">Centro de Ayuda</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-xs font-semibold mb-2">Legal</h4>
            <ul className="space-y-1 text-gray-400 text-xs">
              <li><a href="#" className="hover:text-white">Términos y Condiciones</a></li>
              <li><a href="#" className="hover:text-white">Política de Privacidad</a></li>
              <li><a href="#" className="hover:text-white">Política de Cookies</a></li>
              <li><a href="#" className="hover:text-white">Devoluciones</a></li>
              <li><a href="#" className="hover:text-white">Garantías</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-xs font-semibold mb-2">Empresa</h4>
            <ul className="space-y-1 text-gray-400 text-xs">
              <li><a href="#" className="hover:text-white">Sobre Nosotros</a></li>
              <li><a href="#" className="hover:text-white">Trabaja con Nosotros</a></li>
              <li><a href="#" className="hover:text-white">Sostenibilidad</a></li>
              <li><a href="#" className="hover:text-white">Prensa</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-xs font-semibold mb-2">Newsletter</h4>
            {subscribed ? (
              <div className="bg-green-500 text-white p-2 rounded text-center text-xs">
                ¡Suscrito!
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
                <input 
                  {...register('email')}
                  type="email" 
                  placeholder="tu@email.com" 
                  className="w-full px-2 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 text-xs"
                />
                <button 
                  type="submit"
                  className="w-full bg-primary px-3 py-2 rounded hover:bg-secondary text-xs"
                >
                  Suscribirse
                </button>
              </form>
            )}
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-4 pt-3 flex flex-col md:flex-row justify-between items-center text-gray-400 text-xs space-y-2 md:space-y-0">
          <div className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-4">
            <p>&copy; 2024 <span style={{ fontFamily: 'Dancing Script, cursive' }}>Estilo y Moda</span> S.A.S. Todos los derechos reservados.</p>
            <p>Registro Mercantil: 12345678 | Cámara de Comercio de Bogotá</p>
          </div>
          <div className="flex items-center space-x-2">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Bandera_de_Colombia.svg/20px-Bandera_de_Colombia.svg.png" alt="Colombia" className="w-4 h-3" />
            <span>Hecho en Colombia</span>
          </div>
        </div>
      </div>
    </footer>
  )
}