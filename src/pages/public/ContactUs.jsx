import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getWhatsAppUrl } from '../../data/whatsapp.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

const contactOptions = [
  { title: 'contact.optionFitTitle', description: 'contact.optionFitDescription' },
  { title: 'contact.optionDesignTitle', description: 'contact.optionDesignDescription' },
  { title: 'contact.optionOrderTitle', description: 'contact.optionOrderDescription' },
];

export default function ContactUs() {
  const { language, t, formatNumber } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', topic: 'compatibility', message: '' });
  const [notice, setNotice] = useState('');
  const whatsappReady = Boolean(getWhatsAppUrl('Hello Ninja Wear'));

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const message = [
      t('contact.whatsappGreeting', { name: form.name }),
      `${t('contact.whatsappTopicLabel')}: ${t(`contact.topic${form.topic[0].toUpperCase()}${form.topic.slice(1)}`)}`,
      `${t('contact.whatsappEmailLabel')}: ${form.email}`,
      form.message,
    ].join('\n');
    const url = getWhatsAppUrl(message);

    if (!url) {
      setNotice(t('contact.whatsappError'));
      return;
    }

    // Redirects user to WhatsApp with a prefilled message / توجيه المستخدم لواتساب برسالة مجهزة
    window.open(url, '_blank', 'noopener,noreferrer');
    setNotice(t('contact.whatsappSent'));
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080809] px-5 py-16 text-white sm:px-8 lg:px-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_12%,rgba(239,68,68,0.12),transparent_35%),linear-gradient(135deg,transparent_60%,rgba(245,158,11,0.05))]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mb-14 max-w-3xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-red-300">{t('contact.eyebrow')}</p>
          <h1 className="text-4xl font-extrabold uppercase leading-tight sm:text-5xl">{t('contact.title')}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-gray-400">{t('contact.description')}</p>
        </div>

        <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr]">
          <section aria-labelledby="contact-options-heading">
            <h2 id="contact-options-heading" className="mb-6 text-sm font-bold uppercase tracking-[0.16em] text-gray-300">{t('contact.optionsTitle')}</h2>
            <div className="divide-y divide-white/10 border-y border-white/10">
              {contactOptions.map((option, index) => (
                <article key={option.title} className="grid grid-cols-[2.5rem_1fr] gap-4 py-5">
                  <span className="pt-0.5 font-mono text-sm text-red-300">{formatNumber(index + 1).padStart(2, language === 'ar' ? '٠' : '0')}</span>
                  <div>
                    <h3 className="mb-1 font-bold">{t(option.title)}</h3>
                    <p className="text-sm leading-6 text-gray-500">{t(option.description)}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/apparel" className="rounded-md border border-white/15 px-4 py-3 text-sm font-semibold transition hover:border-white/40">{t('contact.browseApparel')}</Link>
              <Link to="/collections" className="rounded-md border border-white/15 px-4 py-3 text-sm font-semibold transition hover:border-white/40">{t('contact.exploreCollections')}</Link>
            </div>
          </section>

          <section className="border-t border-white/10 pt-8 lg:border-s lg:border-t-0 lg:ps-12 lg:pt-0">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-300">{t('contact.messageEyebrow')}</p>
                <h2 className="text-2xl font-bold">{t('contact.formTitle')}</h2>
              </div>
              <span className={`text-xs font-semibold ${whatsappReady ? 'text-emerald-300' : 'text-gray-500'}`}>
                {whatsappReady ? t('contact.whatsappAvailable') : t('contact.whatsappComing')}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium text-gray-300">
                  {t('contact.name')}
                  <input name="name" value={form.name} onChange={handleChange} required autoComplete="name" className="mt-2 w-full rounded-md border border-white/10 bg-white/3 px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-red-300" placeholder={t('contact.namePlaceholder')} />
                </label>
                <label className="block text-sm font-medium text-gray-300">
                  {t('contact.email')}
                  <input type="email" name="email" value={form.email} onChange={handleChange} required autoComplete="email" className="mt-2 w-full rounded-md border border-white/10 bg-white/3 px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-red-300" placeholder={t('contact.emailPlaceholder')} />
                </label>
              </div>
              <label className="block text-sm font-medium text-gray-300">
                {t('contact.topic')}
                <select name="topic" value={form.topic} onChange={handleChange} required className="mt-2 w-full rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none transition focus:border-red-300">
                  <option value="compatibility">{t('contact.topicCompatibility')}</option>
                  <option value="collection">{t('contact.topicCollection')}</option>
                  <option value="custom">{t('contact.topicCustom')}</option>
                  <option value="order">{t('contact.topicOrder')}</option>
                  <option value="other">{t('contact.topicOther')}</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-gray-300">
                {t('contact.message')}
                <textarea name="message" value={form.message} onChange={handleChange} required rows="5" className="mt-2 w-full resize-y rounded-md border border-white/10 bg-white/3 px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-red-300" placeholder={t('contact.messagePlaceholder')} />
              </label>
              <button type="submit" className="inline-flex w-full items-center justify-center gap-3 rounded-md bg-white px-5 py-4 font-bold text-black transition hover:bg-gray-200 sm:w-auto">
                {t('contact.send')}
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M20.52 3.48A11.78 11.78 0 0 0 12.13 0C5.55 0 .2 5.35.19 11.93c0 2.1.55 4.15 1.6 5.96L.1 24l6.26-1.64a11.9 11.9 0 0 0 5.76 1.47h.01c6.58 0 11.93-5.35 11.94-11.93a11.85 11.85 0 0 0-3.55-8.42ZM12.13 21.8h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.72.98.99-3.63-.23-.37a9.87 9.87 0 0 1-1.52-5.26c0-5.47 4.45-9.92 9.9-9.92a9.85 9.85 0 0 1 7.02 2.91 9.85 9.85 0 0 1 2.9 7.02c0 5.47-4.45 9.92-9.93 9.92Zm5.44-7.43c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.95 1.17-.18.2-.35.23-.65.08-.3-.15-1.26-.47-2.4-1.48-.89-.79-1.49-1.77-1.67-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.53.15-.17.2-.3.3-.5.1-.2.05-.38-.03-.53-.07-.15-.67-1.62-.92-2.22-.24-.58-.48-.5-.67-.51h-.57c-.2 0-.53.08-.8.38-.27.3-1.05 1.02-1.05 2.49s1.08 2.88 1.23 3.08c.15.2 2.13 3.25 5.15 4.56.72.31 1.28.5 1.71.63.72.23 1.37.2 1.89.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.08-.12-.27-.2-.57-.35Z" /></svg>
              </button>
              {notice && <p role="status" className="text-sm text-amber-200">{notice}</p>}
              {!whatsappReady && <p className="text-xs leading-5 text-gray-600">{t('contact.whatsappNotReady')}</p>}
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
