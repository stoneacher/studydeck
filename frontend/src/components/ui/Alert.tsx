import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';

type AlertType = 'error' | 'success' | 'warning' | 'info';

interface AlertProps {
  type: AlertType;
  title?: string;
  message: string;
  onClose?: () => void;
}

const alertConfig = {
  error: {
    icon: XCircle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    iconColor: 'text-red-500',
  },
  success: {
    icon: CheckCircle,
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    iconColor: 'text-green-500',
  },
  warning: {
    icon: AlertCircle,
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    iconColor: 'text-yellow-500',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    iconColor: 'text-blue-500',
  },
};

export function Alert({ type, title, message, onClose }: AlertProps) {
  const config = alertConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={`rounded-lg border p-4 ${config.bg} ${config.border}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 flex-shrink-0 ${config.iconColor}`} />
        <div className="flex-1">
          {title && (
            <h3 className={`font-medium ${config.text}`}>{title}</h3>
          )}
          <p className={`text-sm ${config.text} ${title ? 'mt-1' : ''}`}>
            {message}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`${config.text} hover:opacity-70`}
          >
            <XCircle className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
