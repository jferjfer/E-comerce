import { useState, useEffect, useRef } from 'react'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '¡Hola! Soy María, tu asesora de imagen personal de *Estilo y Moda*. Estoy aquí para ayudarte a encontrar tu estilo perfecto. ¿En qué puedo ayudarte?',
      isUser: false,
      timestamp: new Date()
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const quickActions = [
    { text: '👗 Recomendar outfit para una ocasión', action: 'outfit_recommendation' },
    { text: '🎨 Ayudarme a combinar colores', action: 'color_matching' },
    { text: '💰 Encontrar ofertas en mi talla', action: 'find_deals' }
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
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

    setTimeout(() => {
      const aiResponse = generateAIResponse(text)
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, aiMessage])
      setIsTyping(false)
    }, 1500)
  }

  const generateAIResponse = (userText: string): string => {
    const lowerText = userText.toLowerCase()
    
    if (lowerText.includes('outfit') || lowerText.includes('vestir')) {
      return '¡Perfecto! Para recomendarte el outfit ideal, necesito saber: ¿Para qué ocasión es? (trabajo, casual, fiesta, etc.) y ¿cuáles son tus colores favoritos?'
    }
    
    if (lowerText.includes('color') || lowerText.includes('combinar')) {
      return 'Te ayudo con combinaciones de colores. Los básicos como negro, blanco y gris combinan con todo. Para algo más audaz, prueba: azul marino + beige, verde oliva + crema, o burdeos + gris.'
    }
    
    if (lowerText.includes('oferta') || lowerText.includes('descuento')) {
      return '¡Genial! Tenemos ofertas increíbles: 50% OFF en vestidos de verano, 30% en camisas casuales y envío gratis en compras sobre $150.000. ¿Te interesa alguna categoría específica?'
    }
    
    return 'Entiendo tu consulta. Como asesora de imagen, puedo ayudarte con recomendaciones personalizadas, combinaciones de colores, ofertas especiales y guías de tallas. ¿Hay algo específico que te interese?'
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
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
                >
                  <i className="fas fa-times text-white"></i>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-purple-50 to-white">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
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