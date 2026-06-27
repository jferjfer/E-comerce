import { create } from 'zustand';

interface Notif {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface NotifStore {
  notifications: Notif[];
  addNotification: (message: string, type?: Notif['type']) => void;
  removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotifStore>((set) => ({
  notifications: [],
  addNotification: (message, type = 'info') => {
    const id = Date.now().toString();
    set(s => ({ notifications: [...s.notifications, { id, message, type }] }));
    setTimeout(() => set(s => ({ notifications: s.notifications.filter(n => n.id !== id) })), 2500);
  },
  removeNotification: (id) =>
    set(s => ({ notifications: s.notifications.filter(n => n.id !== id) })),
}));
