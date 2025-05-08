export function CustomTabs() {
  return (
    <div className="w-full max-w-md mx-auto mb-4">
      <div className="grid grid-cols-2 gap-4">
        <button
          className="py-4 rounded-lg font-medium text-center shadow-sm
            bg-white border border-gray-200 text-gray-800"
        >
          환율
        </button>
        
        <button
          className="py-4 rounded-lg font-medium text-center shadow-sm
            bg-white border border-gray-200 text-gray-800"
        >
          필터 아이콘
        </button>
      </div>
    </div>
  );
}