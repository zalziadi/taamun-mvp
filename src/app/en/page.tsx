import Link from "next/link";

/**
 * /en — English marketing landing.
 *
 * Static by design: no cookies, no DB reads at the page level. All CTAs
 * route back to the Arabic app. Visitors are clearly told the experience
 * itself is Arabic — English page is the bridge, not the product.
 */
export default function EnglishLanding() {
  return (
    <main className="max-w-3xl mx-auto px-5 sm:px-8 py-12 space-y-14" dir="ltr">
      <header className="text-center space-y-4">
        <p className="text-[10px] tracking-widest text-[#8c7851]/80 uppercase">
          Taamun · تمعّن
        </p>
        <h1 className="text-3xl sm:text-5xl font-bold text-[#2f2619] leading-tight">
          Quranic reflection in five minutes a day.
        </h1>
        <p className="text-base sm:text-lg text-[#5a4a35] leading-relaxed max-w-xl mx-auto">
          Taamun is a 28-day Quranic reflection journey. A single verse,
          a moment of silence, a question for your heart — designed for
          modern mornings.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-block border border-[#5a4a35] bg-[#5a4a35] text-[#fcfaf7] px-8 py-3 text-sm font-bold hover:opacity-90"
          >
            Start the Arabic journey →
          </Link>
          <p className="mt-3 text-xs text-[#8c7851]">
            The experience itself is in Arabic.
          </p>
        </div>
      </header>

      <section className="grid sm:grid-cols-3 gap-5">
        {[
          {
            title: "Verse-first",
            body: "Every day begins with a single verse — not a lecture. Your heart is the interpreter.",
          },
          {
            title: "Silence before meaning",
            body: "A 20-second silence gate separates noise from signal. You arrive before the words do.",
          },
          {
            title: "A question you write",
            body: "No multiple choice. No pre-written answers. Your own reflection, in your own words.",
          },
        ].map((card) => (
          <article
            key={card.title}
            className="tm-card p-6 space-y-2 text-left"
          >
            <h2 className="text-base font-bold text-[#2f2619]">{card.title}</h2>
            <p className="text-sm text-[#3d342a] leading-relaxed">{card.body}</p>
          </article>
        ))}
      </section>

      <section className="tm-card p-6 sm:p-8 space-y-4 text-center">
        <p className="text-[10px] tracking-widest text-[#8c7851] uppercase">
          From a real customer
        </p>
        <blockquote className="text-lg sm:text-xl leading-loose text-[#2f2619] font-serif">
          &ldquo;I made it through the ninth day. I loved the program and added
          it to my morning routine. Five minutes of reflection — it really
          makes a difference. I feel{" "}
          <span className="font-bold">my heart absorb the meanings</span>.&rdquo;
        </blockquote>
        <p className="text-xs text-[#8c7851] italic">
          — <span dir="rtl">قلبي يتشرب معاني</span> · verified subscriber
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[#2f2619]">Who is this for?</h2>
        <ul className="space-y-3 text-sm text-[#3d342a] leading-relaxed">
          <li>
            <strong className="text-[#2f2619]">Busy professionals</strong> who
            want a Quran practice that fits between subway and standup.
          </li>
          <li>
            <strong className="text-[#2f2619]">Returning readers</strong> who
            have tried translations and commentaries but not their own
            reflection.
          </li>
          <li>
            <strong className="text-[#2f2619]">Diaspora Muslims</strong>
            &nbsp;whose Arabic is rusty but whose longing is not.
          </li>
        </ul>
      </section>

      <section className="tm-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#2f2619]">
          What&rsquo;s in the 28 days?
        </h2>
        <ol className="space-y-2 text-sm text-[#3d342a] list-decimal list-inside">
          <li>A single verse, chosen for a progressive arc</li>
          <li>A silence gate — 20 seconds before meaning surfaces</li>
          <li>A &ldquo;hidden layer&rdquo; — the deeper interpretation</li>
          <li>A quote from <em>The City of Meaning in the Language of the Quran</em></li>
          <li>A reflection question you answer in your own journal</li>
          <li>An awareness meter — how present were you today?</li>
          <li>A shareable verse card for your own people</li>
        </ol>
      </section>

      <section className="text-center space-y-3">
        <h2 className="text-xl font-bold text-[#2f2619]">Start today.</h2>
        <p className="text-sm text-[#5a4a35] max-w-lg mx-auto">
          A free 7-day trial. No card required. Continue if it earns its
          place in your morning.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            href="/"
            className="border border-[#5a4a35] bg-[#5a4a35] text-[#fcfaf7] px-6 py-3 text-sm font-bold hover:opacity-90"
          >
            Open Taamun (Arabic)
          </Link>
          <Link
            href="/en/faq"
            className="border border-[#5a4a35] text-[#5a4a35] px-6 py-3 text-sm font-bold hover:bg-[#5a4a35]/5"
          >
            Read the FAQ
          </Link>
        </div>
      </section>

      <footer className="text-center text-xs text-[#8c7851] border-t border-[#c9bda8]/30 pt-6">
        <p>© Taamun · taamun.com</p>
        <p className="mt-1">
          <Link href="/" className="underline hover:no-underline" hrefLang="ar">
            العربية
          </Link>
        </p>
      </footer>
    </main>
  );
}
