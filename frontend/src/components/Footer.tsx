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
    <footer className="bg-gray-900 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {/* Marca */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-7 h-7 rounded-lg brand-gradient flex items-center justify-center">
                <img src="/logo.png" alt="Estilo y Moda" className="w-4 h-4 object-contain" />
              </div>
              <h3 className="text-sm font-bold" style={{ fontFamily: 'Dancing Script, cursive' }}>Estilo y Moda</h3>
            </div>
            <p className="text-gray-400 text-xs mb-3 leading-relaxed">
              NIT: 900.123.456-7<br/>Bogotá, Colombia
            </p>
            <div className="flex space-x-2">
              {[
                { href: 'https://instagram.com/estiloymodaco', icon: 'fab fa-instagram', bg: 'bg-pink-600' },
                { href: 'https://facebook.com/estiloymodaco', icon: 'fab fa-facebook', bg: 'bg-blue-600' },
                { href: 'https://tiktok.com/@estiloymodaco', icon: 'fab fa-tiktok', bg: 'bg-gray-800' },
                { href: 'https://whatsapp.com/channel/estiloymodaco', icon: 'fab fa-whatsapp', bg: 'bg-green-600' },
              ].map((s, i) => (
                <a key={i} href={s.href} className={`w-7 h-7 ${s.bg} rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity`}>
                  <i className={`${s.icon} text-xs`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Atención */}
          <div>
            <h4 className="text-xs font-semibold mb-2 text-gray-300 uppercase tracking-wider">Atención</h4>
            <ul className="space-y-1.5 text-gray-400 text-xs">
              <li><i className="fas fa-phone mr-1.5"></i>+57 1 234-5678</li>
              <li><i className="fas fa-envelope mr-1.5"></i>hola@estiloymodaco.com</li>
              <li><i className="fas fa-clock mr-1.5"></i>Lun-Vie 8AM-6PM</li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold mb-2 text-gray-300 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-1.5 text-gray-400 text-xs">
              {['Términos y Condiciones', 'Privacidad', 'Cookies', 'Devoluciones'].map(l => (
                <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h4 className="text-xs font-semibold mb-2 text-gray-300 uppercase tracking-wider">Empresa</h4>
            <ul className="space-y-1.5 text-gray-400 text-xs">
              {['Sobre Nosotros', 'Trabaja con Nosotros', 'Sostenibilidad', 'Prensa'].map(l => (
                <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-xs font-semibold mb-2 text-gray-300 uppercase tracking-wider">Newsletter</h4>
            {subscribed ? (
              <div className="bg-emerald-600 text-white p-2 rounded-lg text-center text-xs">
                <i className="fas fa-check mr-1"></i>¡Suscrito!
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
                <input
                  {...register('email')}
                  type="email"
                  placeholder="tu@email.com"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-xs focus:outline-none focus:border-primary"
                />
                <button type="submit" className="w-full brand-gradient px-3 py-2 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity">
                  Suscribirse
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="border-t border-gray-800 mt-6 pt-4 flex flex-col sm:flex-row justify-between items-center text-gray-500 text-xs gap-2">
          <p>&copy; 2024 <span style={{ fontFamily: 'Dancing Script, cursive' }}>Estilo y Moda</span> S.A.S. Todos los derechos reservados.</p>
          <div className="flex items-center space-x-1.5">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Bandera_de_Colombia.svg/20px-Bandera_de_Colombia.svg.png" alt="Colombia" className="w-4 h-3" />
            <span>Hecho en Colombia 🇨🇴</span>
          </div>
        </div>
      </div>
    </footer>
  )
}