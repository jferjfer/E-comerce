import { useState, useEffect, useRef } from 'react'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/useAuthStore'
import ProductRecommendation from './ProductRecommendation'
import EgosLogo from './EgosLogo'
import type { Producto } from '@/types'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
  productos?: Producto[]
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>(() => {
    // Cargar historial del localStorage
    const saved = localStorage.getItem('ai-chat-history')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }))
      } catch {
        return [{
          id: '1',
          text: '¡Hola! Soy Noa ✨ Tu asesora de moda personal en EGOS. Cuéntame, ¿qué estás buscando hoy?',
          isUser: false,
          timestamp: new Date()
        }]
      }
    }
    return [{
      id: '1',
      text: '¡Hola! Soy Noa ✨ Tu asesora de moda personal en EGOS. Cuéntame, ¿qué estás buscando hoy?',
      isUser: false,
      timestamp: new Date()
    }]
  })
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { usuario, token } = useAuthStore()
  const cookiePrefs = JSON.parse(localStorage.getItem('egos_cookie_consent') || '{}')
  const permiteFuncionalidad = cookiePrefs.funcionalidad !== false

  const esCliente = usuario?.rol === 'cliente'

  const quickActions = [
    { text: '👗 Busco outfit para una ocasión especial', action: 'outfit' },
    { text: '🎨 Ayúdame a combinar colores', action: 'colors' },
    { text: '💰 Ver productos recomendados para mí', action: 'recommendations' },
    { text: '📦 ¿Dónde está mi pedido?', action: 'order_status' }
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
    // Guardar historial en localStorage
    localStorage.setItem('ai-chat-history', JSON.stringify(messages))
  }, [messages])

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsTyping(true)

    try {
      // Construir historial para enviar al backend
      const historial = messages.map(m => ({
        role: m.isUser ? 'user' : 'assistant',
        content: m.text
      }))

      // Llamar al backend AI Service
      const resultado = await api.chatIA(
        text.trim(),
        historial,
        permiteFuncionalidad ? usuario?.id : undefined,
        permiteFuncionalidad ? token || undefined : undefined
      )
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: resultado.exito ? resultado.respuesta : 'Lo siento, tengo problemas técnicos. ¿Puedo ayudarte con algo sobre moda?',
        isUser: false,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, aiMessage])

      // Si la IA recomienda productos, extraer IDs y mostrarlos
      if (resultado.exito && resultado.productos_recomendados && resultado.productos_recomendados.length > 0) {
        await mostrarProductosRecomendados(resultado.productos_recomendados)
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Lo siento, no puedo conectarme ahora. ¿Puedo ayudarte con algo sobre moda?',
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const mostrarProductosRecomendados = async (productosIds: string[]) => {
    try {
      const { productos } = await api.obtenerProductos()
      
      // Filtrar productos que coincidan con los IDs recomendados
      const recomendados = productos.filter(p => productosIds.includes(p.id))
      
      if (recomendados.length > 0) {
        const recomendacionMessage: Message = {
          id: (Date.now() + 2).toString(),
          text: '✨ Aquí están los productos que te recomiendo:',
          isUser: false,
          timestamp: new Date(),
          productos: recomendados
        }
        
        setMessages(prev => [...prev, recomendacionMessage])
      }
    } catch (error) {
      console.error('Error obteniendo productos recomendados:', error)
    }
  }

  const handleQuickAction = (action: string, text: string) => {
    handleSendMessage(text.replace(/[👗🎨💰📏🔄📦]/g, '').trim())
  }

  return esCliente ? (
    <>
      {/* Botón Flotante */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative group">
          <button
            onClick={() => setIsOpen(true)}
            className="bg-gray-900 text-white w-14 h-14 rounded-2xl shadow-xl hover:shadow-black/40 transition-all duration-300 hover:scale-105 flex items-center justify-center border border-[#c5a47e]/40"
          >
            <i className="fas fa-magic text-lg" style={{color: '#c5a47e'}}></i>
          </button>

          <div className="absolute bottom-16 right-0 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-[#c5a47e]/30">
            ✨ Asesora de Imagen
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>

          <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-end p-4 z-50">
          <div className="bg-white rounded-t-3xl shadow-2xl w-full max-w-md h-[600px] flex flex-col animate-slide-up">
            {/* Header */}
            <div className="bg-gray-900 text-white p-4 rounded-t-3xl border-b border-[#c5a47e]/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-black border border-[#c5a47e]/40">
                    <EgosLogo size="sm" showSlogan={false} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg tracking-wide">Noa</h3>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <span className="text-xs opacity-70">Asesora de moda EGOS</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      if (confirm('¿Limpiar historial de conversación?')) {
                        localStorage.removeItem('ai-chat-history')
                        setMessages([{
                          id: '1',
                          text: '¡Hola! Soy Noa ✨ Tu asesora de moda personal en EGOS. Cuéntame, ¿qué estás buscando hoy?',
                          isUser: false,
                          timestamp: new Date()
                        }])
                      }
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10"
                    title="Limpiar historial"
                  >
                    <i className="fas fa-trash text-white/60 text-sm"></i>
                  </button>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10"
                  >
                    <i className="fas fa-times text-white/80"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id}>
                    <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                        message.isUser 
                          ? 'bg-gray-900 text-white rounded-br-md' 
                          : 'bg-white shadow-sm border border-[#e5d5c0] text-gray-700 rounded-bl-md'
                      }`}>
                        {!message.isUser && (
                          <div className="flex items-center mb-2">
                            <div className="w-5 h-5 rounded flex items-center justify-center mr-2 bg-black border border-[#c5a47e]/40">
                              <span className="font-bodoni font-normal bg-gradient-to-br from-gold-light via-gold to-gold-dark bg-clip-text text-transparent text-[10px]" style={{letterSpacing:'-1px'}}>E</span>
                            </div>
                            <span className="text-xs font-semibold" style={{color: '#a67c52'}}>Noa</span>
                          </div>
                        )}
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        <p className={`text-xs mt-2 ${
                          message.isUser ? 'text-white/50' : 'text-gray-400'
                        }`}>
                          {message.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    {message.productos && message.productos.length > 0 && (
                      <div className="mt-3 space-y-2 max-w-[80%]">
                        {message.productos.map((producto) => (
                          <ProductRecommendation
                            key={producto.id}
                            producto={producto}
                            razon="Basado en tus preferencias"
                            puntuacion={0.85 + Math.random() * 0.15}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white shadow-sm border border-[#e5d5c0] px-4 py-3 rounded-2xl rounded-bl-md">
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 rounded flex items-center justify-center bg-black border border-[#c5a47e]/40">
                          <span className="font-bodoni font-normal bg-gradient-to-br from-gold-light via-gold to-gold-dark bg-clip-text text-transparent text-[10px]" style={{letterSpacing:'-1px'}}>E</span>
                        </div>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 rounded-full animate-bounce" style={{background: '#c5a47e'}}></div>
                          <div className="w-2 h-2 rounded-full animate-bounce" style={{background: '#c5a47e', animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 rounded-full animate-bounce" style={{background: '#c5a47e', animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Quick Actions */}
            {messages.length === 1 && (
              <div className="px-4 py-2 border-t border-gray-100">
                <div className="grid grid-cols-1 gap-2">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.action, action.text)}
                      className="text-left p-3 text-sm bg-white hover:bg-[#faf6f1] rounded-xl transition-colors border border-[#e5d5c0] text-gray-700"
                    >
                      {action.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
                    placeholder="Escribe tu mensaje..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#c5a47e]/40 focus:border-[#c5a47e] focus:bg-white transition-colors"
                    disabled={isTyping}
                  />
                </div>
                <button
                  onClick={() => handleSendMessage(inputText)}
                  disabled={isTyping || !inputText.trim()}
                  className="w-12 h-12 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all transform hover:scale-105 disabled:opacity-40 disabled:transform-none flex items-center justify-center shadow-lg"
                >
                  <i className="fas fa-paper-plane" style={{color: '#c5a47e'}}></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  ) : null
}