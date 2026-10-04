import Image from "next/image";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Finwise"
      width={2164}
      height={727}
      className={`h-10 w-auto ${className}`}
    />
  );
}
