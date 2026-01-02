import { useState, useEffect, useRef } from 'react'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/useAuthStore'
import ProductRecommendation from './ProductRecommendation'
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
          text: '¡Hola! Soy María, tu asesora de imagen personal de *Estilo y Moda*. Estoy aquí para ayudarte a encontrar tu estilo perfecto. ¿En qué puedo ayudarte?',
          isUser: false,
          timestamp: new Date()
        }]
      }
    }
    return [{
      id: '1',
      text: '¡Hola! Soy María, tu asesora de imagen personal de *Estilo y Moda*. Estoy aquí para ayudarte a encontrar tu estilo perfecto. ¿En qué puedo ayudarte?',
      isUser: false,
      timestamp: new Date()
    }]
  })
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { usuario } = useAuthStore()

  const quickActions = [
    { text: '👗 Recomendar outfit para una ocasión', action: 'outfit_recommendation' },
    { text: '🎨 Ayudarme a combinar colores', action: 'color_matching' },
    { text: '💰 Mostrarme productos recomendados', action: 'show_recommendations' }
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
      const resultado = await api.chatIA(text.trim(), historial)
      
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
    handleSendMessage(text.replace(/[👗🎨💰📏🔄]/g, '').trim())
  }

  return (
    <>
      {/* Botón Flotante */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative group">
          <button 
            onClick={() => setIsOpen(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white w-16 h-16 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 flex items-center justify-center animate-pulse"
          >
            <i className="fas fa-user-circle text-xl"></i>
          </button>
          
          <div className="absolute bottom-20 right-0 bg-black text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            ✨ Asesor de Imagen
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
          </div>
          
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-bold">!</span>
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-end p-4 z-50">
          <div className="bg-white rounded-t-3xl shadow-2xl w-full max-w-md h-[600px] flex flex-col animate-slide-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">M</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">María</h3>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-sm opacity-90">En línea</span>
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
                          text: '¡Hola! Soy María, tu asesora de imagen personal de *Estilo y Moda*. Estoy aquí para ayudarte a encontrar tu estilo perfecto. ¿En qué puedo ayudarte?',
                          isUser: false,
                          timestamp: new Date()
                        }])
                      }
                    }}
                    className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
                    title="Limpiar historial"
                  >
                    <i className="fas fa-trash text-white text-sm"></i>
                  </button>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
                  >
                    <i className="fas fa-times text-white"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-purple-50 to-white">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id}>
                    <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                        message.isUser 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-md' 
                          : 'bg-white shadow-md border border-gray-100 text-gray-800 rounded-bl-md'
                      }`}>
                        {!message.isUser && (
                          <div className="flex items-center mb-2">
                            <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-2">
                              <span className="text-white font-semibold text-xs">M</span>
                            </div>
                            <span className="text-xs font-semibold text-purple-600">María</span>
                          </div>
                        )}
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        <p className={`text-xs mt-2 ${
                          message.isUser ? 'text-white text-opacity-70' : 'text-gray-400'
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
                    <div className="bg-white shadow-md border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-xs">M</span>
                        </div>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
                      className="text-left p-3 text-sm bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-xl transition-colors border border-purple-100"
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
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors"
                    disabled={isTyping}
                  />
                </div>
                <button
                  onClick={() => handleSendMessage(inputText)}
                  disabled={isTyping || !inputText.trim()}
                  className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center justify-center shadow-lg"
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}