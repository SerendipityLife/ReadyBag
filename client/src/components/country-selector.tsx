export function CountrySelector() {
  return (
    <div className="flex items-center space-x-2 p-1">
      <img
        src="/images/logo-icon.svg"
        alt="ReadyBag 로고"
        className="w-6 h-6 object-contain"
      />
      <span 
        className="text-xl text-[#8B4513] tracking-tight" 
        style={{ 
          fontFamily: 'PretendardBlack, Arial Black, sans-serif', 
          fontWeight: 900,
          textShadow: '0.5px 0.5px 0 rgba(139, 69, 19, 0.8), -0.5px -0.5px 0 rgba(139, 69, 19, 0.8)',
          WebkitTextStroke: '0.5px rgba(139, 69, 19, 0.3)'
        }}
      >
        ReadyBag
      </span>
    </div>
  );
}