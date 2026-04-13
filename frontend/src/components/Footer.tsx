import { Link } from 'react-router-dom'
import EgosLogo from './EgosLogo'

export default function Footer() {
  return (
    <footer className="bg-black text-white py-10 border-t border-gold/20">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">

          {/* Marca EGOS */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <EgosLogo size="md" showSlogan={true} />
            </div>
            <p className="text-gray-500 text-xs mb-4 leading-relaxed">
              NIT: 902.051.708-6<br />Bogotá D.C., Colombia
            </p>
            <div className="flex space-x-2">
              {[
                { href: 'https://instagram.com/egos.co', icon: 'fab fa-instagram' },
                { href: 'https://facebook.com/egos.co', icon: 'fab fa-facebook' },
                { href: 'https://tiktok.com/@egos.co', icon: 'fab fa-tiktok' },
                { href: 'https://whatsapp.com/channel/egos', icon: 'fab fa-whatsapp' },
              ].map((s, i) => (
                <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" className="w-7 h-7 border border-gold/30 rounded-lg flex items-center justify-center hover:border-gold hover:text-gold text-gray-400 transition-all">
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
              <li><Link to="/terminos" className="hover:text-gold transition-colors">Términos y Condiciones</Link></li>
              <li><Link to="/privacidad" className="hover:text-gold transition-colors">Privacidad</Link></li>
              <li><Link to="/cookies" className="hover:text-gold transition-colors">Cookies</Link></li>
              <li><Link to="/devoluciones" className="hover:text-gold transition-colors">Devoluciones</Link></li>
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h4 className="text-[10px] font-semibold mb-3 text-gold uppercase tracking-widest">Empresa</h4>
            <ul className="space-y-2 text-gray-400 text-xs">
              <li><Link to="/sobre-nosotros" className="hover:text-gold transition-colors">Sobre Nosotros</Link></li>
              <li><Link to="/trabaja-con-nosotros" className="hover:text-gold transition-colors">Trabaja con Nosotros</Link></li>
              <li><Link to="/sostenibilidad" className="hover:text-gold transition-colors">Sostenibilidad</Link></li>
              <li><Link to="/prensa" className="hover:text-gold transition-colors">Prensa</Link></li>
            </ul>
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
