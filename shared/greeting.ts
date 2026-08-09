import type { Pronouns } from './types';

/**
 * selectGreeting
 *
 * Selects a greeting based ONLY on an explicitly provided pronoun string.
 * Never infer gender from name, photo, country, or role — that is a hard
 * compliance rule from the product spec.
 */
export function selectGreeting(pronouns: Pronouns): string {
  if (pronouns === 'He/Him') return 'Hi Sir,';
  if (pronouns === 'She/Her') return 'Hi Ma\'am,';
  return 'Hello,';
}
