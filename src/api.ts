// Thin wrapper around window.getlux (exposed by electron/preload.ts) that
// unwraps the { ok, data } / { ok, error } envelope every IPC handler
// returns, throwing a plain Error on failure so callers can use try/catch.

async function unwrap<T = any>(promise: Promise<{ ok: boolean; data?: any; error?: string }>): Promise<T> {
  const result = await promise;
  if (!result.ok) throw new Error(result.error || 'Unknown error');
  return result.data as T;
}

export function getApi() {
  const g = window.getlux;
  if (!g) {
    throw new Error('Getlux desktop bridge is unavailable. This app must run inside Electron.');
  }
  return g;
}

export const api = {
  contacts: {
    list: (filters?: any) => unwrap(getApi().contacts.list(filters)),
    get: (id: string) => unwrap(getApi().contacts.get(id)),
    update: (id: string, fields: any) => unwrap(getApi().contacts.update(id, fields)),
    delete: (id: string) => unwrap(getApi().contacts.delete(id)),
    countByStage: () => unwrap(getApi().contacts.countByStage()),
  },
  companies: {
    list: (search?: string) => unwrap(getApi().companies.list(search)),
    get: (id: string) => unwrap(getApi().companies.get(id)),
    create: (input: any) => unwrap(getApi().companies.create(input)),
    update: (id: string, fields: any) => unwrap(getApi().companies.update(id, fields)),
    delete: (id: string) => unwrap(getApi().companies.delete(id)),
  },
  campaigns: {
    list: () => unwrap(getApi().campaigns.list()),
    get: (id: string) => unwrap(getApi().campaigns.get(id)),
    create: (input: any) => unwrap(getApi().campaigns.create(input)),
    update: (id: string, fields: any) => unwrap(getApi().campaigns.update(id, fields)),
    delete: (id: string) => unwrap(getApi().campaigns.delete(id)),
    performance: (id: string) => unwrap(getApi().campaigns.performance(id)),
  },
  templates: {
    list: () => unwrap(getApi().templates.list()),
    create: (name: string, body: string) => unwrap(getApi().templates.create(name, body)),
    update: (id: string, fields: any) => unwrap(getApi().templates.update(id, fields)),
    delete: (id: string) => unwrap(getApi().templates.delete(id)),
  },
  messages: {
    list: (contactId?: string) => unwrap(getApi().messages.list(contactId)),
  },
  replies: {
    list: () => unwrap(getApi().replies.list()),
    create: (contactId: string, outreachMessageId: string | null, text: string) =>
      unwrap(getApi().replies.create(contactId, outreachMessageId, text)),
    markReviewed: (id: string) => unwrap(getApi().replies.markReviewed(id)),
  },
  opportunities: {
    list: () => unwrap(getApi().opportunities.list()),
    create: (input: any) => unwrap(getApi().opportunities.create(input)),
    update: (id: string, fields: any) => unwrap(getApi().opportunities.update(id, fields)),
  },
  followups: {
    list: () => unwrap(getApi().followups.list()),
    dueToday: () => unwrap(getApi().followups.dueToday()),
    create: (input: any) => unwrap(getApi().followups.create(input)),
    update: (id: string, fields: any) => unwrap(getApi().followups.update(id, fields)),
  },
  activity: {
    list: (limit?: number) => unwrap(getApi().activity.list(limit)),
  },
  schedule: {
    get: () => unwrap(getApi().schedule.get()),
    update: (fields: any) => unwrap(getApi().schedule.update(fields)),
  },
  settings: {
    get: (key: string) => unwrap(getApi().settings.get(key)),
    set: (key: string, value: string) => unwrap(getApi().settings.set(key, value)),
    getAll: () => unwrap(getApi().settings.getAll()),
  },
  csv: {
    preview: (content: string) => unwrap(getApi().csv.preview(content)),
    import: (content: string, mapping: any, sourceFilename: string) =>
      unwrap(getApi().csv.import(content, mapping, sourceFilename)),
    openAndRead: () => unwrap(getApi().csv.openAndRead()),
  },
  verification: {
    verifyContact: (contactId: string) => unwrap(getApi().verification.verifyContact(contactId)),
  },
  batch: {
    run: (campaignId: string | null, items: any[]) => unwrap(getApi().batch.run(campaignId, items)),
    stop: (batchRunId: string) => unwrap(getApi().batch.stop(batchRunId)),
    list: () => unwrap(getApi().batch.list()),
    get: (id: string) => unwrap(getApi().batch.get(id)),
    onProgress: (cb: (payload: any) => void) => getApi().batch.onProgress(cb),
  },
  dashboard: {
    metrics: () => unwrap(getApi().dashboard.metrics()),
  },
  exportData: {
    contactsCsv: () => unwrap(getApi().exportData.contactsCsv()),
    messagesCsv: () => unwrap(getApi().exportData.messagesCsv()),
  },
};
