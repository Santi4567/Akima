import { XCircleIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

export const Notification = ({ type, message, onClose }) => {
  if (!message) return null;

  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'bg-green-100' : 'bg-red-100';
  const textColor = isSuccess ? 'text-green-700' : 'text-red-700';
  const Icon = isSuccess ? CheckCircleIcon : XCircleIcon;

  return (
    <div className={`rounded-md ${bgColor} p-4 mb-4`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${textColor}`} aria-hidden="true" />
        </div>
        <div className="ml-3">
          <p className={`text-sm font-medium ${textColor}`}>
            {message}
          </p>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              onClick={onClose}
              className={`inline-flex rounded-md p-1.5 ${textColor} hover:bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2`}
            >
              <span className="sr-only">Cerrar</span>
              <XCircleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};