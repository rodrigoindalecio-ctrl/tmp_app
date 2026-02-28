import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] text-center px-4">
      <div className="max-w-3xl space-y-8 animate-in fade-in zoom-in duration-1000">
        <div className="space-y-4">
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-6 flex items-center justify-center gap-2">
            <span className="w-8 h-px bg-slate-200"></span>
            Gestão de Convidados & RSVP
            <span className="w-8 h-px bg-slate-200"></span>
          </p>
          <h1 className="text-5xl md:text-7xl font-sans font-black text-slate-800 leading-[1.1] tracking-tight">
            Celebre momentos <br />
            <span className="text-brand">inesquecíveis</span>
          </h1>
          <p className="mx-auto max-w-xl text-slate-500 text-lg md:text-xl leading-relaxed mt-6 font-medium">
            A forma mais elegante de confirmar presenças e organizar seus convidados.
            Simples, sofisticado e feito para você.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-5 justify-center pt-8">
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-14 px-8 rounded-xl bg-brand text-white font-bold tracking-wide shadow-lg shadow-brand/20 hover:bg-brand/90 hover:-translate-y-1 transition-all duration-300"
          >
            Acessar Painel
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center h-14 px-8 rounded-xl border-2 border-brand/5 text-brand font-black uppercase tracking-widest bg-white shadow-sm hover:bg-brand hover:text-white hover:-translate-y-1 transition-all duration-300 text-xs"
          >
            Criar meu Evento
          </Link>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="fixed -z-10 top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-slate-100 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-brand/5 rounded-full blur-[100px]" />
      </div>
    </div>
  )
}
