export function KeepRunningBar({ image = "/landing/lifestyle.png" }: { image?: string }) {
  return (
    <footer className="relative overflow-hidden bg-[#071422]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
      <div className="absolute inset-0 bg-[#071422]/55" />
      <div className="relative flex w-full items-center justify-between gap-4 px-4 py-8 lg:px-6">
        <p className="text-sm font-semibold tracking-[0.18em] text-white">POCKET MECHANIC</p>
        <p className="font-script text-2xl text-white">Keep It Running.</p>
      </div>
    </footer>
  );
}
