import { Music2 } from "lucide-react";

interface EmptyStateProps {
  message: string;
  icon?: React.ReactNode;
}

export function EmptyState({ message, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      {icon || <Music2 size={44} className="text-gray-300" />}
      <p className="text-gray-500 text-sm mt-3">{message}</p>
    </div>
  );
}
