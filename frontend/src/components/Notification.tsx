import { useNotificationStore } from '@/store/useNotificationStore'

export default function NotificationContainer() {
  const { notifications, removeNotification } = useNotificationStore()
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return 'fas fa-check'
      case 'error': return 'fas fa-times'
      case 'warning': return 'fas fa-exclamation-triangle'
      default: return 'fas fa-info-circle'
    }
  }
  
  const getColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500'
      case 'error': return 'bg-red-500'
      case 'warning': return 'bg-yellow-500'
      default: return 'bg-blue-500'
    }
  }
  
  return (
    <div className="fixed bottom-4 left-4 z-40 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${getColor(notification.type)} text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in text-sm`}
        >
          <i className={`${getIcon(notification.type)} text-xs`}></i>
          <span className="flex-1 truncate">{notification.message}</span>
          <button
            onClick={() => removeNotification(notification.id)}
            className="hover:bg-white/20 rounded p-1 flex-shrink-0"
          >
            <i className="fas fa-times text-xs"></i>
          </button>
        </div>
      ))}
    </div>
  )
}