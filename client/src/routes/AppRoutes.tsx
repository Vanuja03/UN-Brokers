import { Navigate, Route, Routes } from 'react-router-dom';
import { PublicLayout } from '../components/layout/PublicLayout';
import { AdminLayout } from '../components/layout/AdminLayout';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { HomePage } from '../pages/HomePage';
import { AboutPage } from '../pages/AboutPage';
import { InsuranceIndexPage } from '../pages/InsuranceIndexPage';
import { ServicePage } from '../pages/ServicePage';
import { PartnersPage } from '../pages/PartnersPage';
import { TestimonialsPage } from '../pages/TestimonialsPage';
import { TeamPage } from '../pages/TeamPage';
import { ContactPage } from '../pages/ContactPage';
import { RequestQuotePage } from '../pages/RequestQuotePage';
import { FaqPage } from '../pages/FaqPage';
import { GuideArticlePage, GuidesPage } from '../pages/GuidePages';
import { PrivacyPage } from '../pages/PrivacyPage';
import { TermsPage } from '../pages/TermsPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { LoginPage } from '../pages/admin/LoginPage';
import { DashboardPage } from '../pages/admin/DashboardPage';
import { QuotationsPage } from '../pages/admin/QuotationsPage';
import { QuotationDetailPage } from '../pages/admin/QuotationDetailPage';
import { ContactsPage } from '../pages/admin/ContactsPage';
import { ContentPage } from '../pages/admin/ContentPage';
import { SettingsPage } from '../pages/admin/SettingsPage';
import { services } from '../content/services';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="insurance" element={<InsuranceIndexPage />} />
        {services.map((service) => (
          <Route key={service.slug} path={`insurance/${service.slug}`} element={<ServicePage slug={service.slug} />} />
        ))}
        <Route path="partners" element={<PartnersPage />} />
        <Route path="testimonials" element={<TestimonialsPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="request-quote" element={<RequestQuotePage />} />
        <Route path="faq" element={<FaqPage />} />
        <Route path="guides" element={<GuidesPage />} />
        <Route path="guides/:slug" element={<GuideArticlePage />} />
        <Route path="privacy-policy" element={<PrivacyPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="admin/login" element={<LoginPage />} />
      <Route path="admin" element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="quotations" element={<QuotationsPage />} />
          <Route path="quotations/:id" element={<QuotationDetailPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="content" element={<ContentPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
