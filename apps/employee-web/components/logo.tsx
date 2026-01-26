import Image from 'next/image';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/chez-noura-logo.svg"
        alt="Chez Noura"
        width={32}
        height={32}
        className="w-8 h-8"
      />
      <span className="text-xl font-semibold text-gray-900">Chez Noura</span>
    </div>
  );
}
