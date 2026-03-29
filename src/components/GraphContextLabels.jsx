/**
 * Premium glass headers for graph screens: merged context (drug + disease) and split panel labels.
 */
export function MergedContextHeader({ drugName, diseaseName }) {
  return (
    <div className="pointer-events-none absolute left-4 top-4 z-10 max-w-[min(92vw,26rem)] sm:max-w-[min(92vw,32rem)]">
      <div className="graph-context-shell rounded-2xl p-px">
        <div className="glass-panel rounded-[15px] px-5 py-4 sm:px-6 sm:py-5">
          <p className="mb-3 text-[10px] font-light uppercase tracking-[0.22em] text-zinc-500">
            Session context
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-0">
            <div className="min-w-0 flex-1">
              <span className="text-xs font-light uppercase tracking-[0.18em] text-cyan-400/90">
                Drug
              </span>
              <p
                className="mt-1.5 truncate bg-gradient-to-r from-cyan-100 to-cyan-300/90 bg-clip-text text-base font-light text-transparent sm:text-lg"
                title={drugName}
              >
                {drugName}
              </p>
            </div>

            <div
              className="hidden shrink-0 sm:mx-5 sm:flex sm:w-px sm:flex-col sm:justify-center"
              aria-hidden
            >
              <div className="min-h-[3rem] w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />
            </div>
            <div
              className="h-px w-full bg-gradient-to-r from-cyan-500/15 via-fuchsia-500/25 to-transparent sm:hidden"
              aria-hidden
            />

            <div className="min-w-0 flex-1">
              <span className="text-xs font-light uppercase tracking-[0.18em] text-fuchsia-400/90">
                Disease
              </span>
              <p
                className="mt-1.5 truncate bg-gradient-to-r from-fuchsia-100 to-fuchsia-300/90 bg-clip-text text-base font-light text-transparent sm:text-lg"
                title={diseaseName}
              >
                {diseaseName}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const escChipClass =
  'rounded-lg border border-white/10 bg-zinc-950/60 px-2.5 py-1.5 text-xs font-light text-zinc-500 backdrop-blur-md transition-all duration-300 ease-in-out'

export function SplitPanelLabel({ variant, name, showEsc }) {
  const isDrug = variant === 'drug'
  const shell = isDrug ? 'graph-context-shell--cyan' : 'graph-context-shell--fuchsia'
  const caption = isDrug ? 'Drug' : 'Disease'
  const captionClass = isDrug
    ? 'text-xs font-light uppercase tracking-[0.18em] text-cyan-400/90'
    : 'text-xs font-light uppercase tracking-[0.18em] text-fuchsia-400/90'
  const titleClass = isDrug
    ? 'bg-gradient-to-r from-cyan-100 to-cyan-200/85 bg-clip-text text-base font-light text-transparent'
    : 'bg-gradient-to-r from-fuchsia-100 to-fuchsia-200/85 bg-clip-text text-base font-light text-transparent'

  return (
    <div
      className={`flex max-w-[min(48vw,22rem)] flex-wrap items-start gap-2 ${!isDrug && showEsc ? 'flex-row-reverse' : ''}`}
    >
      <div className={`${shell} min-w-0 flex-1 rounded-xl p-px`}>
        <div className="glass-panel rounded-[11px] px-4 py-3">
          <span className={captionClass}>{caption}</span>
          <p className={`mt-1 truncate ${titleClass}`} title={name}>
            {name}
          </p>
        </div>
      </div>
      {showEsc && <span className={escChipClass}>ESC to exit</span>}
    </div>
  )
}
