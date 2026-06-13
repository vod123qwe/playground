/** Fixed top bar rendered over the canvas (outside the scroll container). */
export default function Header() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-5 sm:px-10">
      <div className="pointer-events-auto flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_16px_4px_rgba(255,255,255,0.6)]" />
        <span className="text-lg font-semibold tracking-[0.2em]">AURA</span>
      </div>

      <nav className="pointer-events-auto hidden gap-8 text-sm text-white/60 sm:flex">
        <a className="transition hover:text-white" href="#">Produkt</a>
        <a className="transition hover:text-white" href="#">Technologia</a>
        <a className="transition hover:text-white" href="#">Kontakt</a>
      </nav>

      <button className="pointer-events-auto rounded-full border border-white/20 px-5 py-2 text-sm text-white/80 transition hover:bg-white/10">
        Demo
      </button>
    </header>
  );
}
