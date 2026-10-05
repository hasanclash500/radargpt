import { Building2, Quote, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function BrandStorySection() {
  return (
    <section className="relative overflow-hidden border-y border-border/60 bg-card/30">
      <div className="pointer-events-none absolute inset-0 grid-overlay opacity-30" />
      <div className="pointer-events-none absolute -start-24 top-10 size-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -end-20 bottom-0 size-64 rounded-full bg-amber-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-background/85 p-6 shadow-xl backdrop-blur sm:p-10"
        >
          <div className="absolute end-0 top-0 h-32 w-32 rounded-bl-[5rem] bg-primary/8" />

          <div className="relative max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-extrabold text-primary">
              <Sparkles className="size-3.5" />
              روایت دیوساز
            </span>

            <h2 className="mt-5 text-3xl font-black leading-[1.45] tracking-tight sm:text-4xl">
              دیوساز؛ جایی که
              <span className="text-gradient-brand"> قدرت و آفرینش </span>
              به هم می‌رسند.
            </h2>

            <p className="mt-5 max-w-3xl text-sm leading-8 text-muted-foreground sm:text-base sm:leading-9">
              در اسطوره‌های ایران، «دیو» نماد دانش و توانمندی بود و «ساز» یعنی ساختن.
              ما با همان قدرت و تخصص، فضای کسب‌وکار شما را بنا می‌کنیم.
            </p>

            <blockquote className="mt-7 max-w-2xl rounded-3xl border border-primary/20 bg-primary/[0.045] p-5 sm:p-6">
              <Quote className="size-7 text-primary/70" />
              <p className="mt-3 text-xl font-black leading-9 sm:text-2xl">
                «به سنگ و به گچ، دیو دیوار کرد»
              </p>
              <footer className="mt-3 text-sm font-extrabold text-primary">
                — فردوسی
              </footer>
            </blockquote>

            <div className="mt-7 flex items-center gap-3 rounded-2xl border border-border/70 bg-card/70 p-4 sm:max-w-2xl">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Building2 className="size-5" />
              </span>
              <p className="text-sm font-black leading-7 sm:text-base">
                از سوله تا دفتر، دیوساز فضای شما را می‌سازد.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
