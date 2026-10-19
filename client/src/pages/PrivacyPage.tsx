import { Link } from 'react-router-dom';
import { Seo } from '../components/common/Seo';
import { Container } from '../components/common/Container';
import { useSettings } from '../context/SettingsContext';

export function PrivacyPage() {
  const { settings } = useSettings();
  return (
    <Container className="max-w-3xl space-y-4 py-12 text-base leading-7 text-slate-700">
      <Seo
        title="Privacy notice"
        description={`How ${settings.companyName} looks after client information when arranging insurance and assisting with claims.`}
        path="/privacy-policy"
      />
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-navy-700">Confidentiality</p>
      <h1 className="text-4xl font-bold text-navy-900">Privacy notice</h1>
      <div className="h-1 w-12 rounded-full bg-gold" />
      <p>
        {settings.companyName} is a registered insurance broking company in Sri Lanka. We treat the information you share with us as confidential, and we handle it with the care expected of a professional insurance broker, in keeping with the requirements of the Insurance Regulatory Commission of Sri Lanka and the personal data protection law that applies in Sri Lanka.
      </p>
      <p>This notice explains how we look after that information when you ask us for advice, a quotation, or help with a claim, and when you write to us.</p>

      <h2 className="pt-4 text-2xl font-bold text-navy-900">The information you share with us</h2>
      <p>
        To advise you properly we need to know who you are and what you wish to insure. You will usually tell us your name, telephone number, email address, and how you prefer to be contacted, together with the particulars of the risk. That may be a vehicle, a journey, a home or other property, or a business.
      </p>
      <p>
        Please give us the details needed for the advice you have asked for, and make sure they are accurate to the best of your knowledge. Do not send payment card numbers, or copies of identity documents, unless we have asked you for a document an insurer requires.
      </p>

      <h2 className="pt-4 text-2xl font-bold text-navy-900">How we use it</h2>
      <p>We use your information to:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>understand your requirements and the level of protection you are looking for;</li>
        <li>explain the options available from insurers and the differences between them;</li>
        <li>request quotations and help you compare premiums, benefits, and conditions;</li>
        <li>arrange cover if you decide to proceed, and assist you if you later need to make a claim;</li>
        <li>keep in touch with you about your inquiry and meet our professional duties as your broker.</li>
      </ul>
      <p>We do not sell your information, and we do not use it for purposes that have nothing to do with your insurance.</p>

      <h2 className="pt-4 text-2xl font-bold text-navy-900">Who we share it with</h2>
      <p>
        Insurance can only be arranged by placing the relevant details before the insurers we approach on your behalf. We share what those insurers need in order to consider the risk, prepare a quotation, issue a policy, or deal with a claim. We do not share your affairs more widely than that purpose requires.
      </p>
      <p>
        We may also disclose information where the law, or the Insurance Regulatory Commission of Sri Lanka, requires us to do so.
      </p>

      <h2 className="pt-4 text-2xl font-bold text-navy-900">Our duty of confidentiality</h2>
      <p>
        Your information is available only to the people in our firm who are dealing with your matter. We expect the insurers we instruct to treat it with the same professional confidence. Asking us for a quotation does not purchase a policy. It begins a confidential conversation about the cover that may suit you.
      </p>

      <h2 className="pt-4 text-2xl font-bold text-navy-900">How long we keep it</h2>
      <p>
        We keep your information while we are advising you, arranging or looking after your insurance, or assisting with a claim, and for the further period our professional and regulatory duties require. When it is no longer needed for those purposes, we dispose of it with care.
      </p>

      <h2 className="pt-4 text-2xl font-bold text-navy-900">Your wishes</h2>
      <p>
        You may ask what information we hold about you, ask us to correct something that is wrong, or ask us about closing our record where we are not obliged to keep it. Write to us through the <Link className="font-semibold text-navy-900 underline" to="/contact">contact form</Link>
        {settings.email ? <> or email {settings.email}</> : null}
        {settings.telephone ? <> or telephone {settings.telephone}</> : null}
        . If we have given you a reference number, please include it so we can find your matter promptly.
      </p>
      {settings.address ? <p>Our office is at {settings.address}.</p> : null}
    </Container>
  );
}
