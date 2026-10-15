import { Link } from 'react-router-dom';
import { Seo } from '../components/common/Seo';
import { Container } from '../components/common/Container';
import { useSettings } from '../context/SettingsContext';

export function PrivacyPage() {
  const { settings } = useSettings();
  return (
    <Container className="max-w-3xl space-y-4 py-12 text-sm leading-7 text-slate-700">
      <Seo title="Privacy notice" description={`How ${settings.companyName} handles quotation and contact inquiries.`} path="/privacy-policy" />
      <h1 className="text-4xl font-bold text-navy-900">Privacy notice</h1>
      <p>This notice explains how {settings.companyName} handles information submitted through this website. Have it reviewed for your jurisdiction before production use.</p>
      <h2 className="text-2xl font-bold text-navy-900">What we collect</h2>
      <p>Quotation forms collect your name, telephone number, email address, preferred contact method, insurance category, and the details needed for that category. The contact form collects your name, email, telephone, subject, and message. You are asked to confirm that you have read this notice.</p>
      <p>The public forms do not ask for payment card numbers, medical records, or copies of identity documents.</p>
      <h2 className="text-2xl font-bold text-navy-900">Why we use it</h2>
      <p>The information is used to review your inquiry, contact you, and, where needed to prepare a quotation you requested, share relevant details with an insurance provider. It is also used to keep a record of the inquiry for follow-up.</p>
      <h2 className="text-2xl font-bold text-navy-900">Email</h2>
      <p>If email delivery is configured, the business is notified and you may receive an acknowledgment containing your reference number. A saved inquiry is not deleted if email delivery fails.</p>
      <h2 className="text-2xl font-bold text-navy-900">Cookies</h2>
      <p>Staff sign-in uses secure cookies that the browser sends back to the API. Those cookies are not used to store customer inquiries. Optional analytics cookies are loaded only if a measurement ID is configured and you accept the notice.</p>
      <h2 className="text-2xl font-bold text-navy-900">How long it is kept</h2>
      <p>Inquiries are kept while they are being handled and for a limited period afterwards. Staff can archive an inquiry. An administrator can permanently delete one. Security audit records of staff actions are kept for up to a year and do not copy the full inquiry.</p>
      <h2 className="text-2xl font-bold text-navy-900">Your request</h2>
      <p>To ask about access or deletion, use the <Link className="font-semibold underline" to="/contact">contact form</Link>{settings.email ? <> or email {settings.email}</> : null} and include your reference number.</p>
    </Container>
  );
}
