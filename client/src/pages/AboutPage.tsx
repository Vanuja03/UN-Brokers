import { Photo } from '../components/common/Photo';
import { Seo } from '../components/common/Seo';
import { Container } from '../components/common/Container';
import { aboutImage } from '../content/services';
import { useSettings } from '../context/SettingsContext';

export function AboutPage() {
  const { settings } = useSettings();
  return (
    <Container className="grid items-start gap-10 py-12 lg:grid-cols-[1.1fr_0.9fr]">
      <Seo title={`About ${settings.companyName}`} description={settings.aboutIntro} path="/about" />
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-navy-700">About us</p>
        <h1 className="mt-2 text-4xl font-bold">{settings.companyName}</h1>
        <p className="mt-4 text-base leading-7 text-slate-700">{settings.aboutIntro}</p>
        <div className="mt-8 grid gap-4">
          <article className="rounded-2xl border border-slate-200 p-5"><h2 className="text-xl font-bold">Mission</h2><p className="mt-2 text-sm leading-6 text-slate-600">{settings.mission}</p></article>
          <article className="rounded-2xl border border-slate-200 p-5"><h2 className="text-xl font-bold">Vision</h2><p className="mt-2 text-sm leading-6 text-slate-600">{settings.vision}</p></article>
        </div>
        <h2 className="mt-8 text-2xl font-bold">Values</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {settings.values.map((value) => <li key={value.title} className="rounded-2xl bg-navy-50 p-5"><h3 className="font-bold">{value.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{value.description}</p></li>)}
        </ul>
      </div>
      <Photo src={aboutImage} alt="Colleagues in a meeting" className="h-80 w-full rounded-3xl object-cover lg:h-full" />
    </Container>
  );
}
