import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { PIPELINE_STAGES, type PipelineStage } from '../../shared/types';
import { canTransition } from '../../shared/pipeline';

export default function Pipeline(): JSX.Element {
  const [contacts, setContacts] = useState<any[]>([]);

  const load = () => api.contacts.list().then(setContacts);

  useEffect(() => { load(); }, []);

  const byStage = (stage: string) => contacts.filter((c) => c.crm_pipeline_stage === stage);

  const moveTo = async (contact: any, targetStage: PipelineStage) => {
    if (!canTransition(contact.crm_pipeline_stage, targetStage)) {
      alert(`Cannot move from "${contact.crm_pipeline_stage}" to "${targetStage}".`);
      return;
    }
    await api.contacts.update(contact.id, { crm_pipeline_stage: targetStage });
    load();
  };

  return (
    <div>
      <h1>Opportunities / Pipeline Kanban</h1>
      <p className="page-subtitle">Drag-free kanban — use the dropdown on each card to move it forward (validated transitions only).</p>
      <div className="kanban-board">
        {PIPELINE_STAGES.map((stage) => (
          <div className="kanban-column" key={stage}>
            <div className="kanban-column-title">{stage} ({byStage(stage).length})</div>
            {byStage(stage).map((c) => (
              <div className="kanban-card" key={c.id}>
                <div><strong>{c.full_name}</strong></div>
                <div style={{ color: 'var(--text-muted)' }}>{c.verified_current_company || c.csv_company}</div>
                <select
                  style={{ marginTop: 6, width: '100%' }}
                  value=""
                  onChange={(e) => e.target.value && moveTo(c, e.target.value as PipelineStage)}
                >
                  <option value="">Move to…</option>
                  {PIPELINE_STAGES.filter((s) => s !== stage).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
