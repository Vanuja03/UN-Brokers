import { Seo } from '../components/common/Seo';
import { Container } from '../components/common/Container';
import { useSettings } from '../context/SettingsContext';

export function TermsPage() {
  const { settings } = useSettings();
  return (
    <Container className="max-w-3xl space-y-4 py-12 text-sm leading-7 text-slate-700">
      <Seo title="Terms and conditions" description={`Terms for using the ${settings.companyName} website and quotation inquiry forms.`} path="/terms" />
      <h1 className="text-4xl font-bold text-navy-900">Terms and conditions</h1>
      <p>These terms apply to use of the {settings.companyName} website. They should be reviewed, and the governing law confirmed, before the site is used with customers.</p>
      <h2 className="text-2xl font-bold text-navy-900">Information only</h2>
      <p>Pages on this website explain insurance categories and collect inquiries. They are not insurance policies, quotations, or legal advice.</p>
      <h2 className="text-2xl font-bold text-navy-900">Quotation inquiries</h2>
      <p>Submitting a form does not purchase cover, bind an insurer, or guarantee that terms will be offered. Any policy is issued by an insurer on its own wording. The brokerage does not promise the lowest price or that a claim will be approved.</p>
      <h2 className="text-2xl font-bold text-navy-900">Your information</h2>
      <p>You agree that the details you submit are accurate to the best of your knowledge. Inaccurate vehicle, property, payroll, or trip details can affect whether an insurer offers terms.</p>
      <h2 className="text-2xl font-bold text-navy-900">Liability</h2>
      <p>The website is provided as a way to contact the brokerage. It is not a promise that the site will be available at all times or that an inquiry will produce a quotation.</p>
      <h2 className="text-2xl font-bold text-navy-900">Governing law</h2>
      <p>The laws that apply where the brokerage operates govern these terms, unless a reviewed version of this page names a different law.</p>
    </Container>
  );
}
