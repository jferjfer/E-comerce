import { useNotificationStore } from '@/store/useNotificationStore'

export default function NotificationContainer() {
  const { notifications, removeNotification } = useNotificationStore()

  const getStyles = (type: string) => {
    switch (type) {
      case 'success': return { bar: 'bg-gold',     bg: 'bg-black border-gold/30',       text: 'text-gold',      icon: 'fas fa-check-circle text-gold' }
      case 'error':   return { bar: 'bg-red-500',  bg: 'bg-black border-red-500/30',    text: 'text-red-400',   icon: 'fas fa-times-circle text-red-400' }
      case 'warning': return { bar: 'bg-amber-500',bg: 'bg-black border-amber-500/30',  text: 'text-amber-400', icon: 'fas fa-exclamation-circle text-amber-400' }
      default:        return { bar: 'bg-gray-600', bg: 'bg-black border-white/10',      text: 'text-gray-300',  icon: 'fas fa-info-circle text-gray-400' }
    }
  }

  return (
    <div className="fixed top-20 right-2 sm:right-4 z-[9999] space-y-2 w-[calc(100vw-1rem)] max-w-xs pointer-events-none">
      {notifications.map((n) => {
        const s = getStyles(n.type)
        return (
          <div
            key={n.id}
            className={`${s.bg} border rounded-none flex items-start overflow-hidden animate-notif-in pointer-events-auto shadow-lg shadow-black/50`}
          >
            <div className={`${s.bar} w-0.5 flex-shrink-0 self-stretch`}></div>
            <div className="flex items-start space-x-2.5 px-3 py-2.5 flex-1">
              <i className={`${s.icon} text-sm mt-0.5 flex-shrink-0`}></i>
              <p className={`text-xs font-medium ${s.text} flex-1 leading-snug tracking-wide`}>{n.message}</p>
              <button
                onClick={() => removeNotification(n.id)}
                className="text-gray-600 hover:text-gray-400 flex-shrink-0 ml-1"
              >
                <i className="fas fa-times text-xs"></i>
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
