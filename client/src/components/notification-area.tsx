import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  type: string;
  message: string;
  detail?: string;
}

interface NotificationAreaProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

export default function NotificationArea({ notifications, onRemove }: NotificationAreaProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-success" size={16} />;
      case 'warning': return <AlertTriangle className="text-warning" size={16} />;
      case 'error': return <XCircle className="text-error" size={16} />;
      default: return <Info className="text-primary" size={16} />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-success';
      case 'warning': return 'border-warning';
      case 'error': return 'border-error';
      default: return 'border-primary';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`bg-white border-l-4 ${getBorderColor(notification.type)} rounded-lg shadow-lg p-4 max-w-sm transform transition-all duration-300 ease-in-out`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon(notification.type)}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">{notification.message}</p>
              {notification.detail && (
                <p className="text-xs text-gray-500 mt-1">{notification.detail}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(notification.id)}
              className="ml-4 text-gray-400 hover:text-gray-600 p-1 h-auto"
            >
              <X size={12} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
