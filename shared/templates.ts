import type { MessageTemplate } from './types';

// 10 "Connection Message" templates — used for contacts who are already a
// 1st-degree LinkedIn connection (connectionStatus/contact_status ===
// 'Connected'). {{GREETING}} and {{COMPANY}} are the only personalization
// placeholders — all other facts (services, client list, sender details)
// are fixed and must never be invented or altered per recipient, per the
// product spec.
export const CONNECTION_MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'template-1',
    name: 'Collections role — direct',
    type: 'Connection Message',
    body:
      '{{GREETING}}\n\n' +
      'I noticed your role in collections at {{COMPANY}}.\n\n' +
      'Getlux supports NBFCs and lending businesses with professional collection support, including tele-calling and field-collection requirements. We currently support organizations such as IDFC Bank, KreditBee, Navi Finserv, Payrupik, Nira Finance, Moneyview, Kissht, and Groww.\n\n' +
      'Our pan-India tele-calling team includes 150+ trained callers, supported by offices across Bangalore, Tamil Nadu, and Kerala.\n\n' +
      'If collection support may be useful for {{COMPANY}}, please let us know. We would be happy to share our company profile.\n\n' +
      'Regards,\nSabari – Getlux\n+91 6363958868 | Business@getlux.co.in | www.getlux.co.in',
  },
  {
    id: 'template-2',
    name: 'Collections or recovery — agency support',
    type: 'Connection Message',
    body:
      '{{GREETING}}\n\n' +
      'Saw that you are currently handling collections or recovery at {{COMPANY}}.\n\n' +
      'Getlux provides collection-agency support for NBFCs, lenders, and financial-service companies. Our team manages pan-India tele-calling collections through 150+ trained tele-callers, with operational presence in Bangalore, Tamil Nadu, and Kerala.\n\n' +
      'We support companies including IDFC Bank, KreditBee, Navi Finserv, Payrupik, Nira Finance, Moneyview, Kissht, and Groww.\n\n' +
      'Would it be okay to share the Getlux company profile for your reference?\n\n' +
      'Regards,\nSabari – Getlux\n+91 6363958868 | Business@getlux.co.in | www.getlux.co.in',
  },
  {
    id: 'template-3',
    name: 'Collections role — profile and details',
    type: 'Connection Message',
    body:
      '{{GREETING}}\n\n' +
      'I came across your collections role at {{COMPANY}}.\n\n' +
      'Getlux helps lending and NBFC businesses strengthen their collection operations through pan-India tele-calling support. We have 150+ trained collection callers and offices across Bangalore, Tamil Nadu, and Kerala.\n\n' +
      'Our experience includes supporting organizations such as IDFC Bank, KreditBee, Navi Finserv, Payrupik, Nira Finance, Moneyview, Kissht, and Groww.\n\n' +
      'If you are exploring collection-agency support for {{COMPANY}}, I can share our profile and service details.\n\n' +
      'Regards,\nSabari – Getlux\n+91 6363958868 | Business@getlux.co.in | www.getlux.co.in',
  },
  {
    id: 'template-4',
    name: 'Recovery operations — capacity focus',
    type: 'Connection Message',
    body:
      '{{GREETING}}\n\n' +
      'I noticed your work in recovery operations at {{COMPANY}}.\n\n' +
      'Getlux is a collections-support partner for NBFCs, banks, and fintechs, offering pan-India tele-calling collections backed by 150+ trained tele-callers and offices in Bangalore, Tamil Nadu, and Kerala.\n\n' +
      'We currently work with organizations such as IDFC Bank, KreditBee, Navi Finserv, Payrupik, Nira Finance, Moneyview, Kissht, and Groww.\n\n' +
      'If {{COMPANY}} is looking to add collections capacity, I would be glad to share more information.\n\n' +
      'Regards,\nSabari – Getlux\n+91 6363958868 | Business@getlux.co.in | www.getlux.co.in',
  },
  {
    id: 'template-5',
    name: 'Credit/lending operations — introduction',
    type: 'Connection Message',
    body:
      '{{GREETING}}\n\n' +
      'Your background in credit and lending operations at {{COMPANY}} caught my attention.\n\n' +
      'Getlux partners with NBFCs and financial-service companies for tele-calling collections support across India, with a team of 150+ trained tele-callers and offices in Bangalore, Tamil Nadu, and Kerala.\n\n' +
      'Some of the organizations we support include IDFC Bank, KreditBee, Navi Finserv, Payrupik, Nira Finance, Moneyview, Kissht, and Groww.\n\n' +
      'Happy to share our company profile if this is relevant for {{COMPANY}}.\n\n' +
      'Regards,\nSabari – Getlux\n+91 6363958868 | Business@getlux.co.in | www.getlux.co.in',
  },
  {
    id: 'template-6',
    name: 'Receivables / delinquency management',
    type: 'Connection Message',
    body:
      '{{GREETING}}\n\n' +
      'I saw that you work on receivables and delinquency management at {{COMPANY}}.\n\n' +
      'Getlux supports lenders and NBFCs with pan-India tele-calling collections, backed by 150+ trained tele-callers and offices across Bangalore, Tamil Nadu, and Kerala.\n\n' +
      'We currently support organizations such as IDFC Bank, KreditBee, Navi Finserv, Payrupik, Nira Finance, Moneyview, Kissht, and Groww.\n\n' +
      'If it would help to have additional collections bandwidth at {{COMPANY}}, I can share our profile and approach.\n\n' +
      'Regards,\nSabari – Getlux\n+91 6363958868 | Business@getlux.co.in | www.getlux.co.in',
  },
  {
    id: 'template-7',
    name: 'Banking / financial services — introduction',
    type: 'Connection Message',
    body:
      '{{GREETING}}\n\n' +
      'I came across your profile and your work in financial services at {{COMPANY}}.\n\n' +
      'Getlux is a collections-support company working with banks, NBFCs, and fintechs across India. Our pan-India tele-calling team has 150+ trained callers, with offices in Bangalore, Tamil Nadu, and Kerala.\n\n' +
      'We work with organizations such as IDFC Bank, KreditBee, Navi Finserv, Payrupik, Nira Finance, Moneyview, Kissht, and Groww.\n\n' +
      'If useful, I would be happy to send over our company profile for {{COMPANY}} to review.\n\n' +
      'Regards,\nSabari – Getlux\n+91 6363958868 | Business@getlux.co.in | www.getlux.co.in',
  },
  {
    id: 'template-8',
    name: 'Field collections — regional support',
    type: 'Connection Message',
    body:
      '{{GREETING}}\n\n' +
      'Noticed your involvement with field and tele-calling collections at {{COMPANY}}.\n\n' +
      'Getlux provides pan-India tele-calling collections support, along with field-collection support where available, through a team of 150+ trained tele-callers based out of Bangalore, Tamil Nadu, and Kerala.\n\n' +
      'We currently support reference clients including IDFC Bank, KreditBee, Navi Finserv, Payrupik, Nira Finance, Moneyview, Kissht, and Groww.\n\n' +
      'Would you be open to a short profile of our services for {{COMPANY}}?\n\n' +
      'Regards,\nSabari – Getlux\n+91 6363958868 | Business@getlux.co.in | www.getlux.co.in',
  },
  {
    id: 'template-9',
    name: 'Loan servicing / repayment — short intro',
    type: 'Connection Message',
    body:
      '{{GREETING}}\n\n' +
      'I noticed you work on loan servicing and repayment at {{COMPANY}}.\n\n' +
      'Getlux supports NBFCs and lenders with pan-India tele-calling collections, run by a team of 150+ trained tele-callers with offices in Bangalore, Tamil Nadu, and Kerala.\n\n' +
      'Our reference clients include IDFC Bank, KreditBee, Navi Finserv, Payrupik, Nira Finance, Moneyview, Kissht, and Groww.\n\n' +
      'Let me know if a quick overview of our services would be useful for {{COMPANY}}.\n\n' +
      'Regards,\nSabari – Getlux\n+91 6363958868 | Business@getlux.co.in | www.getlux.co.in',
  },
  {
    id: 'template-10',
    name: 'Risk / payment recovery — partnership note',
    type: 'Connection Message',
    body:
      '{{GREETING}}\n\n' +
      'I came across your work in risk and payment recovery at {{COMPANY}}.\n\n' +
      'Getlux is a pan-India tele-calling collections partner for NBFCs, banks, and financial-service companies, with 150+ trained tele-callers and offices across Bangalore, Tamil Nadu, and Kerala.\n\n' +
      'We currently support organizations such as IDFC Bank, KreditBee, Navi Finserv, Payrupik, Nira Finance, Moneyview, Kissht, and Groww.\n\n' +
      'If {{COMPANY}} is evaluating collection-agency support, I would be glad to share our profile and next steps.\n\n' +
      'Regards,\nSabari – Getlux\n+91 6363958868 | Business@getlux.co.in | www.getlux.co.in',
  },
];

// 3 "Invitation Note" templates — used for prospects who are NOT yet a
// LinkedIn connection (connectionStatus/contact_status === 'Not Connected'
// or unset). LinkedIn caps invite notes at ~300 characters, so these are
// intentionally short. Same {{GREETING}}/{{COMPANY}} placeholders, same
// explicit-pronoun-only greeting rule (see shared/greeting.ts) — never
// inferred from name.
export const INVITATION_NOTE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'invite-1',
    name: 'Invitation — collections/recovery support',
    type: 'Invitation Note',
    body:
      '{{GREETING}} I support NBFCs and lenders with collections and recovery ' +
      'services at Getlux. Would love to connect and share how we might help ' +
      '{{COMPANY}}.',
  },
  {
    id: 'invite-2',
    name: 'Invitation — tele-calling collections partner',
    type: 'Invitation Note',
    body:
      '{{GREETING}} Noticed your work in collections/recovery. I\'m with Getlux, ' +
      'a pan-India tele-calling collections partner for NBFCs and lenders. Open ' +
      'to connecting?',
  },
  {
    id: 'invite-3',
    name: 'Invitation — short introduction',
    type: 'Invitation Note',
    body:
      '{{GREETING}} I\'m Sabari from Getlux — we help NBFCs and lenders with ' +
      'pan-India collections support. Would be great to connect with you.',
  },
];

// Combined list, used for seeding the SQLite message_templates table so the
// DB and this file never drift apart.
export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  ...CONNECTION_MESSAGE_TEMPLATES,
  ...INVITATION_NOTE_TEMPLATES,
];

/**
 * renderTemplate
 *
 * Substitutes {{GREETING}} and {{COMPANY}} placeholders in a template body.
 * Pure function — no persistence, no network.
 */
export function renderTemplate(
  template: MessageTemplate,
  vars: { greeting: string; company: string },
): string {
  return template.body
    .split('{{GREETING}}').join(vars.greeting)
    .split('{{COMPANY}}').join(vars.company);
}
