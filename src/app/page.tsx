import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] text-center px-6 relative overflow-hidden bg-gradient-to-b from-[#FDF8F6] to-white">
      <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
        <div className="space-y-6">
          <div className="inline-flex items-center justify-center gap-3 px-6 py-2 bg-white/50 backdrop-blur-md rounded-full border border-slate-100 shadow-sm transition-all hover:scale-105 group">
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            <p className="text-[10px] font-black tracking-[0.4em] text-slate-400 uppercase">
              Sua Vida Organizada • RSVP
            </p>
          </div>

          <h1 className="text-6xl md:text-8xl font-black text-[#2D1B1E] leading-[1.05] tracking-tighter">
            Celebre com <br />
            <span className="text-brand relative inline-block">
              sofisticação
              <svg className="absolute -bottom-2 md:-bottom-4 left-0 w-full text-brand/20 h-4 md:h-6" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0 10 Q 25 20 50 10 T 100 10" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" /></svg>
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-slate-400 text-lg md:text-xl leading-relaxed mt-10 font-bold uppercase tracking-widest opacity-80 decoration-brand/30">
            O sistema de gestão de convidados <br className="hidden md:block" /> mais elegante e eficiente do mercado.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
          <Link
            href="/login"
            className="group relative inline-flex items-center justify-center h-16 px-12 rounded-[2rem] bg-brand text-white text-[11px] font-black uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(112,36,49,0.2)] transition-all hover:-translate-y-1.5 hover:shadow-brand/30 active:translate-y-0"
          >
            Entrar no Painel
            <span className="ml-3 group-hover:translate-x-1.5 transition-transform duration-300">→</span>
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center h-16 px-12 rounded-[2rem] border-2 border-slate-100 bg-white text-slate-600 text-[11px] font-black uppercase tracking-[0.2em] shadow-sm hover:bg-slate-50 hover:border-slate-200 hover:-translate-y-1.5 transition-all duration-300"
          >
            Criar meu Evento
          </Link>
        </div>

        {/* SOCIAL PROOF / STATS MOCKUP */}
        <div className="pt-20 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700">
          {[
            { l: 'CONFIRMAÇÕES', v: '98%' },
            { l: 'EVENTOS', v: '1.2k+' },
            { l: 'CONVIDADOS', v: '50k+' },
            { l: 'MÉTRICAS', v: 'REAL' }
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-xl font-black text-[#2D1B1E] tracking-tighter">{s.v}</p>
              <p className="text-[8px] font-black text-slate-400 tracking-widest uppercase mt-1">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative Elements - Premium Background */}
      <div className="fixed -z-10 top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] right-[10%] w-[50%] h-[50%] bg-brand/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#FDF8F6] rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] border-[1px] border-brand/5 rounded-[5rem] opacity-20 pointer-events-none" />
      </div>
    </div>
  )
}
