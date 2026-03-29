/**
 * Loading component with spinner
 */

export function Loading({ message = "Đang tải..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[200px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  );
}

export function LoadingInline({
  message = "Đang tải...",
}: {
  message?: string;
}) {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
      <span className="ml-3 text-gray-600">{message}</span>
    </div>
  );
}
