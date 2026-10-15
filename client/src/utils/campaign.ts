const KEY = 'ub_campaign';

export type Campaign = {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
};

export function captureCampaign() {
  const params = new URLSearchParams(window.location.search);
  const campaign: Campaign = {
    source: params.get('utm_source') || undefined,
    medium: params.get('utm_medium') || undefined,
    campaign: params.get('utm_campaign') || undefined,
    term: params.get('utm_term') || undefined,
    content: params.get('utm_content') || undefined,
  };
  if (Object.values(campaign).some(Boolean)) {
    sessionStorage.setItem(KEY, JSON.stringify(campaign));
  }
}

export function readCampaign(): Campaign | undefined {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Campaign;
    return Object.values(parsed).some(Boolean) ? parsed : undefined;
  } catch {
    return undefined;
  }
}
