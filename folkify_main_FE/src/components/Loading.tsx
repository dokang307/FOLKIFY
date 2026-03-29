import { Loader2 } from "lucide-react";

interface LoadingProps {
  message?: string;
}

export function Loading({ message = "Đang tải..." }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F7FAF8]">
      <Loader2 size={40} className="text-[#2D6A4F] animate-spin" />
      <p className="text-gray-600 text-sm mt-4">{message}</p>
    </div>
  );
}
