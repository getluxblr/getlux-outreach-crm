import { describe, it, expect } from 'vitest';
import {
  MESSAGE_TEMPLATES,
  CONNECTION_MESSAGE_TEMPLATES,
  INVITATION_NOTE_TEMPLATES,
  renderTemplate,
} from '@shared/templates';
import { selectGreeting } from '@shared/greeting';
import { INVITATION_NOTE_CHAR_LIMIT } from '@shared/types';

describe('connection message templates', () => {
  it('has exactly 10 templates', () => {
    expect(CONNECTION_MESSAGE_TEMPLATES.length).toBe(10);
  });

  it('has unique ids', () => {
    const ids = new Set(CONNECTION_MESSAGE_TEMPLATES.map((t) => t.id));
    expect(ids.size).toBe(10);
  });

  it('every template is typed as Connection Message', () => {
    for (const t of CONNECTION_MESSAGE_TEMPLATES) {
      expect(t.type).toBe('Connection Message');
    }
  });

  it('every template contains both placeholders', () => {
    for (const t of CONNECTION_MESSAGE_TEMPLATES) {
      expect(t.body).toContain('{{GREETING}}');
      expect(t.body).toContain('{{COMPANY}}');
    }
  });

  it('every template contains the required factual claims', () => {
    for (const t of CONNECTION_MESSAGE_TEMPLATES) {
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
    const rendered = renderTemplate(CONNECTION_MESSAGE_TEMPLATES[0], { greeting, company: 'Acme NBFC' });
    expect(rendered).toContain('Hi Sir,');
    expect(rendered).toContain('Acme NBFC');
    expect(rendered).not.toContain('{{GREETING}}');
    expect(rendered).not.toContain('{{COMPANY}}');
  });

  it('renderTemplate replaces every occurrence of {{COMPANY}}', () => {
    const rendered = renderTemplate(CONNECTION_MESSAGE_TEMPLATES[0], { greeting: 'Hello,', company: 'Beta Bank' });
    const occurrences = rendered.split('Beta Bank').length - 1;
    expect(occurrences).toBeGreaterThanOrEqual(2);
  });
});

describe('invitation note templates', () => {
  it('has at least 2 templates', () => {
    expect(INVITATION_NOTE_TEMPLATES.length).toBeGreaterThanOrEqual(2);
  });

  it('has unique ids', () => {
    const ids = new Set(INVITATION_NOTE_TEMPLATES.map((t) => t.id));
    expect(ids.size).toBe(INVITATION_NOTE_TEMPLATES.length);
  });

  it('every template is typed as Invitation Note', () => {
    for (const t of INVITATION_NOTE_TEMPLATES) {
      expect(t.type).toBe('Invitation Note');
    }
  });

  it('every template contains the {{GREETING}} placeholder', () => {
    for (const t of INVITATION_NOTE_TEMPLATES) {
      expect(t.body).toContain('{{GREETING}}');
    }
  });

  it('stays within the LinkedIn invite note character limit for realistic values', () => {
    const greetings = ['Hi Sir,', "Hi Ma'am,", 'Hello,'];
    const companies = ['Bright Finserv NBFC', 'Southbank Financial Services and Advisory'];
    for (const t of INVITATION_NOTE_TEMPLATES) {
      for (const greeting of greetings) {
        for (const company of companies) {
          const rendered = renderTemplate(t, { greeting, company });
          expect(rendered.length).toBeLessThanOrEqual(INVITATION_NOTE_CHAR_LIMIT);
        }
      }
    }
  });
});

describe('MESSAGE_TEMPLATES (combined seed list)', () => {
  it('is the union of connection message and invitation note templates', () => {
    expect(MESSAGE_TEMPLATES.length).toBe(
      CONNECTION_MESSAGE_TEMPLATES.length + INVITATION_NOTE_TEMPLATES.length,
    );
  });

  it('has unique ids across both types', () => {
    const ids = new Set(MESSAGE_TEMPLATES.map((t) => t.id));
    expect(ids.size).toBe(MESSAGE_TEMPLATES.length);
  });
});
