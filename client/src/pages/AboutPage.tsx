import { AboutStory, aboutSummary } from '../components/about/AboutStory';
import { Seo } from '../components/common/Seo';
import { Container } from '../components/common/Container';
import { useSettings } from '../context/SettingsContext';

export function AboutPage() {
  const { settings } = useSettings();
  return (
    <Container className="py-12">
      <Seo title={`About ${settings.companyName}`} description={aboutSummary} path="/about" />
      <AboutStory title={settings.companyName} heading="h1" />
    </Container>
  );
}
