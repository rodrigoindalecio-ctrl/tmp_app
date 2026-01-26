import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] text-center px-4">
      <div className="max-w-3xl space-y-8 animate-in fade-in zoom-in duration-1000">
        <div className="space-y-4">
          <p className="text-sm font-medium tracking-[0.3em] uppercase text-primary mb-6">
            Gestão de Convidados & RSVP
          </p>
          <h1 className="text-5xl md:text-7xl font-serif text-textPrimary leading-[1.1] tracking-tight">
            Celebre momentos <br />
            <span className="italic text-textSecondary opacity-80">inesquecíveis</span>
          </h1>
          <p className="mx-auto max-w-xl text-textSecondary text-lg md:text-xl leading-relaxed mt-6 font-light">
            A forma mais elegante de confirmar presenças e organizar seus convidados.
            Simples, sofisticado e feito para você.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-5 justify-center pt-8">
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-primary text-white font-medium tracking-wide shadow-lg shadow-primary/25 hover:bg-primary/90 hover:-translate-y-1 transition-all duration-300"
          >
            Acessar Painel
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center h-12 px-8 rounded-full border border-borderSoft bg-white text-textPrimary font-medium tracking-wide shadow-sm hover:border-primary/50 hover:text-primary transition-all duration-300"
          >
            Criar meu Evento
          </Link>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="fixed -z-10 top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-stone-100 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-orange-50 rounded-full blur-[100px]" />
      </div>
    </div>
  )
}
