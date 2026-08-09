import { describe, it, expect } from 'vitest';
import { MESSAGE_TEMPLATES, renderTemplate } from '@shared/templates';
import { selectGreeting } from '@shared/greeting';

describe('templates', () => {
  it('has exactly 10 templates', () => {
    expect(MESSAGE_TEMPLATES.length).toBe(10);
  });

  it('has unique ids', () => {
    const ids = new Set(MESSAGE_TEMPLATES.map((t) => t.id));
    expect(ids.size).toBe(10);
  });

  it('every template contains both placeholders', () => {
    for (const t of MESSAGE_TEMPLATES) {
      expect(t.body).toContain('{{GREETING}}');
      expect(t.body).toContain('{{COMPANY}}');
    }
  });

  it('every template contains the required factual claims', () => {
    for (const t of MESSAGE_TEMPLATES) {
      expect(t.body).toContain('Getlux');
      expect(t.body).toContain('150+ trained');
      expect(t.body).toContain('Bangalore, Tamil Nadu, and Kerala');
      expect(t.body).toContain('IDFC Bank');
      expect(t.body).toContain('KreditBee');
      expect(t.body).toContain('Navi Finserv');
      expect(t.body).toContain('Payrupik');
      expect(t.body).toContain('Nira Finance');
      expect(t.body).toContain('Moneyview');
      expect(t.body).toContain('Kissht');
      expect(t.body).toContain('Groww');
      expect(t.body).toContain('Sabari');
      expect(t.body).toContain('+91 6363958868');
      expect(t.body).toContain('Business@getlux.co.in');
      expect(t.body).toContain('www.getlux.co.in');
    }
  });

  it('renderTemplate substitutes greeting and company', () => {
    const greeting = selectGreeting('He/Him');
    const rendered = renderTemplate(MESSAGE_TEMPLATES[0], { greeting, company: 'Acme NBFC' });
    expect(rendered).toContain('Hi Sir,');
    expect(rendered).toContain('Acme NBFC');
    expect(rendered).not.toContain('{{GREETING}}');
    expect(rendered).not.toContain('{{COMPANY}}');
  });

  it('renderTemplate replaces every occurrence of {{COMPANY}}', () => {
    const rendered = renderTemplate(MESSAGE_TEMPLATES[0], { greeting: 'Hello,', company: 'Beta Bank' });
    const occurrences = rendered.split('Beta Bank').length - 1;
    expect(occurrences).toBeGreaterThanOrEqual(2);
  });
});
