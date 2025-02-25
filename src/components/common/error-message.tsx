// components/common/error-message.tsx
export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded relative" role="alert">
      <span className="block sm:inline">{message}</span>
    </div>
  );
}