import { useEffect, useState } from 'react';
import { FaqList } from '../components/common/FaqList';
import { Seo } from '../components/common/Seo';
import { Container } from '../components/common/Container';
import { fallbackFaqs } from '../content/guides';
import { api } from '../services/api';
import type { Faq } from '../types';

export function FaqPage() {
  const [items, setItems] = useState(fallbackFaqs);
  useEffect(() => {
    api.get('/faqs?category=general').then((response) => {
      const data = response.data.data as Faq[];
      if (data.length) setItems(data.map((item) => ({ question: item.question, answer: item.answer })));
    }).catch(() => undefined);
  }, []);
  return (
    <Container className="max-w-3xl py-12">
      <Seo title="Frequently asked questions" description="How quotation inquiries, documents, timing, and personal information are handled." path="/faq" />
      <h1 className="text-4xl font-bold">Frequently asked questions</h1>
      <p className="mt-3 text-slate-600">These answers describe this website’s inquiry process. They should be updated if the company’s procedure changes.</p>
      <div className="mt-8"><FaqList items={items} /></div>
    </Container>
  );
}
