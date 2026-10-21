import { useState } from 'react';
import { Seo } from '../components/common/Seo';
import { Container } from '../components/common/Container';
import { FeedbackCard } from '../components/feedback/FeedbackCard';
import { customerFeedback } from '../content/customerFeedback';

export function TestimonialsPage() {
  const [openName, setOpenName] = useState<string | null>(null);
  return (
    <Container className="py-12">
      <Seo title="Client testimonials" description="Feedback from businesses that arrange their insurance with UN Insurance Brokers." path="/testimonials" />
      <h1 className="text-4xl font-bold">Client testimonials</h1>
      <p className="mt-3 max-w-2xl text-slate-600">Comments from businesses that arrange their insurance with UN Insurance Brokers.</p>
      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {customerFeedback.map((item) => (
          <li key={item.name}>
            <FeedbackCard
              item={item}
              expanded={openName === item.name}
              onToggle={() => setOpenName((current) => (current === item.name ? null : item.name))}
            />
          </li>
        ))}
      </ul>
    </Container>
  );
}
