/**
 * ConfirmDialog Component
 *
 * A reusable confirmation dialog using Radix UI AlertDialog.
 * Supports different variants (danger, warning, info) with color coding.
 * Ensures keyboard navigation and focus management.
 *
 * Requirements: 1.6, 13.1, 13.2, 13.3
 */

import * as AlertDialog from "@radix-ui/react-alert-dialog";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "warning" | "info";
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "info",
}: ConfirmDialogProps) {
  // Color coding based on variant
  const variantStyles = {
    danger: {
      title: "text-red-900",
      button: "bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white",
      border: "border-red-200",
    },
    warning: {
      title: "text-yellow-900",
      button:
        "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 text-white",
      border: "border-yellow-200",
    },
    info: {
      title: "text-blue-900",
      button: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white",
      border: "border-blue-200",
    },
  };

  const styles = variantStyles[variant];

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onCancel();
        }
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <AlertDialog.Content
          className={`
            fixed left-1/2 top-1/2 z-50 
            -translate-x-1/2 -translate-y-1/2
            w-full max-w-lg
            bg-white rounded-lg shadow-lg
            border-2 ${styles.border}
            p-6
            data-[state=open]:animate-in 
            data-[state=closed]:animate-out 
            data-[state=closed]:fade-out-0 
            data-[state=open]:fade-in-0 
            data-[state=closed]:zoom-out-95 
            data-[state=open]:zoom-in-95
            focus:outline-none
          `}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            onCancel();
          }}
          aria-describedby="dialog-description"
        >
          {/* Title */}
          <AlertDialog.Title
            className={`text-xl font-semibold mb-4 ${styles.title}`}
            id="dialog-title"
          >
            {title}
          </AlertDialog.Title>

          {/* Message */}
          <AlertDialog.Description
            className="text-gray-700 mb-6 text-base leading-relaxed"
            id="dialog-description"
          >
            {message}
          </AlertDialog.Description>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <AlertDialog.Cancel asChild>
              <button
                onClick={onCancel}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onCancel();
                  }
                }}
                className="
                  px-4 py-2 
                  text-sm font-medium 
                  text-gray-700 
                  bg-white 
                  border border-gray-300 
                  rounded-md 
                  hover:bg-gray-50 
                  focus:outline-none 
                  focus:ring-2 
                  focus:ring-offset-2 
                  focus:ring-gray-500
                  transition-colors
                "
                tabIndex={0}
                aria-label={`${cancelText} dialog`}
              >
                {cancelText}
              </button>
            </AlertDialog.Cancel>

            <AlertDialog.Action asChild>
              <button
                onClick={onConfirm}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onConfirm();
                  }
                }}
                className={`
                  px-4 py-2 
                  text-sm font-medium 
                  rounded-md 
                  focus:outline-none 
                  focus:ring-2 
                  focus:ring-offset-2 
                  transition-colors
                  ${styles.button}
                `}
                tabIndex={0}
                aria-label={`${confirmText} action`}
              >
                {confirmText}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
