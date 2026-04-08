import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { newsletterSchema, NewsletterForm } from '@/utils/validation'

export default function Footer() {
  const [subscribed, setSubscribed] = useState(false)

  const { register, handleSubmit, reset } = useForm<NewsletterForm>({
    resolver: zodResolver(newsletterSchema)
  })

  const onSubmit = (data: NewsletterForm) => {
    setSubscribed(true)
    reset()
    setTimeout(() => setSubscribed(false), 3000)
  }

  return (
    <footer className="bg-black text-white py-10 border-t border-gold/20">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-6 md:gap-8">

          {/* Marca EGOS — ocupa las 2 columnas en móvil */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <div className="flex flex-col items-center leading-none mb-1">
                <span className="font-bodoni text-3xl bg-gradient-to-br from-gold-light via-gold to-gold-dark bg-clip-text text-transparent" style={{letterSpacing: '-2px'}}>E</span>
                <span className="font-prata text-base text-white tracking-[8px] uppercase -mt-1">GOS</span>
              </div>
              <p className="font-bodoni italic text-xs text-gold opacity-70 tracking-[3px] uppercase text-center">Wear Your Truth</p>
            </div>
            <p className="text-gray-500 text-xs mb-4 leading-relaxed">
              NIT: 902.051.708-6<br/>Bogotá D.C., Colombia
            </p>
            <div className="flex space-x-2">
              {[
                { href: 'https://instagram.com/egos.co', icon: 'fab fa-instagram' },
                { href: 'https://facebook.com/egos.co', icon: 'fab fa-facebook' },
                { href: 'https://tiktok.com/@egos.co', icon: 'fab fa-tiktok' },
                { href: 'https://whatsapp.com/channel/egos', icon: 'fab fa-whatsapp' },
              ].map((s, i) => (
                <a key={i} href={s.href} className="w-7 h-7 border border-gold/30 rounded-lg flex items-center justify-center hover:border-gold hover:text-gold text-gray-400 transition-all">
                  <i className={`${s.icon} text-xs`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Atención */}
          <div>
            <h4 className="text-[10px] font-semibold mb-3 text-gold uppercase tracking-widest">Atención</h4>
            <ul className="space-y-2 text-gray-400 text-xs">
              <li><i className="fas fa-phone mr-1.5 text-gold/60"></i>301 787 9852</li>
              <li><i className="fas fa-phone mr-1.5 text-gold/60"></i>314 811 3593</li>
              <li><i className="fas fa-envelope mr-1.5 text-gold/60"></i>servicioalcliente@egoscolombia.com</li>
              <li><i className="fas fa-clock mr-1.5 text-gold/60"></i>Lun-Vie 8AM-6PM</li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[10px] font-semibold mb-3 text-gold uppercase tracking-widest">Legal</h4>
            <ul className="space-y-2 text-gray-400 text-xs">
              {['Términos y Condiciones', 'Privacidad', 'Cookies', 'Devoluciones'].map(l => (
                <li key={l}><a href="#" className="hover:text-gold transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h4 className="text-[10px] font-semibold mb-3 text-gold uppercase tracking-widest">Empresa</h4>
            <ul className="space-y-2 text-gray-400 text-xs">
              {['Sobre Nosotros', 'Trabaja con Nosotros', 'Sostenibilidad', 'Prensa'].map(l => (
                <li key={l}><a href="#" className="hover:text-gold transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-[10px] font-semibold mb-3 text-gold uppercase tracking-widest">Newsletter</h4>
            {subscribed ? (
              <div className="border border-gold/40 text-gold p-2 rounded-lg text-center text-xs">
                <i className="fas fa-check mr-1"></i>¡Suscrito!
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
                <input
                  {...register('email')}
                  type="email"
                  placeholder="tu@email.com"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 text-xs focus:outline-none focus:border-gold/50"
                />
                <button type="submit" className="w-full bg-gold text-black px-3 py-2 rounded-lg text-xs font-semibold hover:bg-gold-light transition-colors">
                  Suscribirse
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="border-t border-white/5 mt-8 pt-5 flex flex-col sm:flex-row justify-between items-center text-gray-600 text-xs gap-2">
          <p>&copy; 2026 <span className="font-prata tracking-widest text-gray-500">VERTEL & CATILLO S.A.S</span> Todos los derechos reservados.</p>
          <div className="flex items-center space-x-1.5">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Bandera_de_Colombia.svg/20px-Bandera_de_Colombia.svg.png" alt="Colombia" className="w-4 h-3" />
            <span>Hecho en Colombia 🇨🇴</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
