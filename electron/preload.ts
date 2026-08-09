import { contextBridge, ipcRenderer } from 'electron';

// Every IPC call funnels through this single typed `invoke` helper so the
// renderer never gets direct access to Node/Electron APIs (contextIsolation
// stays on, nodeIntegration stays off). Handlers on the main side always
// return { ok, data } or { ok: false, error }.
function invoke(channel: string, ...args: any[]) {
  return ipcRenderer.invoke(channel, ...args);
}

const api = {
  contacts: {
    list: (filters?: any) => invoke('contacts:list', filters),
    get: (id: string) => invoke('contacts:get', id),
    update: (id: string, fields: any) => invoke('contacts:update', id, fields),
    delete: (id: string) => invoke('contacts:delete', id),
    countByStage: () => invoke('contacts:countByStage'),
    createManual: (input: any) => invoke('contacts:createManual', input),
  },
  companies: {
    list: (search?: string) => invoke('companies:list', search),
    get: (id: string) => invoke('companies:get', id),
    create: (input: any) => invoke('companies:create', input),
    update: (id: string, fields: any) => invoke('companies:update', id, fields),
    delete: (id: string) => invoke('companies:delete', id),
  },
  campaigns: {
    list: () => invoke('campaigns:list'),
    get: (id: string) => invoke('campaigns:get', id),
    create: (input: any) => invoke('campaigns:create', input),
    update: (id: string, fields: any) => invoke('campaigns:update', id, fields),
    delete: (id: string) => invoke('campaigns:delete', id),
    performance: (id: string) => invoke('campaigns:performance', id),
  },
  templates: {
    list: () => invoke('templates:list'),
    create: (name: string, body: string, type?: string) => invoke('templates:create', name, body, type),
    update: (id: string, fields: any) => invoke('templates:update', id, fields),
    delete: (id: string) => invoke('templates:delete', id),
  },
  messages: {
    list: (contactId?: string) => invoke('messages:list', contactId),
    create: (input: any) => invoke('messages:create', input),
    markManualSent: (id: string) => invoke('messages:markManualSent', id),
    markDraftCopied: (id: string) => invoke('messages:markDraftCopied', id),
  },
  replies: {
    list: () => invoke('replies:list'),
    create: (contactId: string, outreachMessageId: string | null, text: string) =>
      invoke('replies:create', contactId, outreachMessageId, text),
    markReviewed: (id: string) => invoke('replies:markReviewed', id),
  },
  opportunities: {
    list: () => invoke('opportunities:list'),
    create: (input: any) => invoke('opportunities:create', input),
    update: (id: string, fields: any) => invoke('opportunities:update', id, fields),
  },
  followups: {
    list: () => invoke('followups:list'),
    dueToday: () => invoke('followups:dueToday'),
    create: (input: any) => invoke('followups:create', input),
    update: (id: string, fields: any) => invoke('followups:update', id, fields),
  },
  activity: {
    list: (limit?: number) => invoke('activity:list', limit),
  },
  schedule: {
    get: () => invoke('schedule:get'),
    update: (fields: any) => invoke('schedule:update', fields),
  },
  settings: {
    get: (key: string) => invoke('settings:get', key),
    set: (key: string, value: string) => invoke('settings:set', key, value),
    getAll: () => invoke('settings:getAll'),
  },
  csv: {
    preview: (content: string) => invoke('csv:preview', content),
    detectLinkedInExport: (headers: string[]) => invoke('csv:detectLinkedInExport', headers),
    import: (content: string, mapping: any, sourceFilename: string, connectionStatus?: string) =>
      invoke('csv:import', content, mapping, sourceFilename, connectionStatus),
    openAndRead: () => invoke('csv:openAndRead'),
  },
  verification: {
    verifyContact: (contactId: string) => invoke('verification:verifyContact', contactId),
  },
  batch: {
    run: (campaignId: string | null, items: any[]) => invoke('batch:run', campaignId, items),
    stop: (batchRunId: string) => invoke('batch:stop', batchRunId),
    list: () => invoke('batch:list'),
    get: (id: string) => invoke('batch:get', id),
    onProgress: (callback: (payload: any) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, payload: any) => callback(payload);
      ipcRenderer.on('batch:progress', listener);
      return () => ipcRenderer.removeListener('batch:progress', listener);
    },
  },
  dashboard: {
    metrics: () => invoke('dashboard:metrics'),
  },
  linkedinData: {
    get: () => invoke('linkedinData:get'),
    update: (fields: any) => invoke('linkedinData:update', fields),
  },
  exportData: {
    contactsCsv: () => invoke('export:contactsCsv'),
    messagesCsv: () => invoke('export:messagesCsv'),
  },
  shell: {
    // Opens a URL in the user's normal default browser (a plain new tab),
    // exactly like clicking a hyperlink. Never used to log into LinkedIn,
    // click anything on linkedin.com, or automate any site.
    openExternal: (url: string) => invoke('shell:openExternal', url),
  },
};

export type GetluxApi = typeof api;

contextBridge.exposeInMainWorld('getlux', api);
