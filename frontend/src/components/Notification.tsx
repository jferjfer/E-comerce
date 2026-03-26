import { useNotificationStore } from '@/store/useNotificationStore'

export default function NotificationContainer() {
  const { notifications, removeNotification } = useNotificationStore()

  const getStyles = (type: string) => {
    switch (type) {
      case 'success': return { bar: 'bg-emerald-500', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', icon: 'fas fa-check-circle text-emerald-500' }
      case 'error':   return { bar: 'bg-red-500',     bg: 'bg-red-50 border-red-200',         text: 'text-red-800',     icon: 'fas fa-times-circle text-red-500' }
      case 'warning': return { bar: 'bg-amber-500',   bg: 'bg-amber-50 border-amber-200',     text: 'text-amber-800',   icon: 'fas fa-exclamation-circle text-amber-500' }
      default:        return { bar: 'bg-primary',     bg: 'bg-purple-50 border-purple-200',   text: 'text-purple-800',  icon: 'fas fa-info-circle text-primary' }
    }
  }

  return (
    <div className="fixed top-20 right-4 z-[9999] space-y-2 max-w-xs w-full pointer-events-none">
      {notifications.map((n) => {
        const s = getStyles(n.type)
        return (
          <div
            key={n.id}
            className={`${s.bg} border rounded-xl shadow-lg flex items-start overflow-hidden animate-notif-in pointer-events-auto`}
          >
            {/* Barra lateral de color */}
            <div className={`${s.bar} w-1 flex-shrink-0 self-stretch rounded-l-xl`}></div>
            <div className="flex items-start space-x-2.5 px-3 py-2.5 flex-1">
              <i className={`${s.icon} text-base mt-0.5 flex-shrink-0`}></i>
              <p className={`text-sm font-medium ${s.text} flex-1 leading-snug`}>{n.message}</p>
              <button
                onClick={() => removeNotification(n.id)}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-1"
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
