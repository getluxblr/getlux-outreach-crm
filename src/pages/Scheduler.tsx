import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Scheduler(): JSX.Element {
  const [schedule, setSchedule] = useState<any>(null);

  const load = () => api.schedule.get().then(setSchedule);

  useEffect(() => { load(); }, []);

  const toggleEnabled = async () => {
    await api.schedule.update({ enabled: schedule.enabled ? 0 : 1 });
    load();
  };

  const updateTime = async (time: string) => {
    await api.schedule.update({ schedule_time: time });
    load();
  };

  const updateBatchSize = async (size: number) => {
    await api.schedule.update({ batch_size: size });
    load();
  };

  if (!schedule) return <div className="empty-state">Loading…</div>;

  return (
    <div>
      <h1>Scheduler</h1>
      <p className="page-subtitle">
        Daily automated batches are OFF by default per compliance requirements. Enabling this only schedules a mock
        batch run inside the app — it never contacts LinkedIn on its own.
      </p>

      <div className="panel">
        <div className="toolbar">
          <button className={`btn ${schedule.enabled ? 'btn-danger' : 'btn-primary'}`} onClick={toggleEnabled}>
            {schedule.enabled ? 'Pause Automation' : 'Resume Automation'}
          </button>
          <label>Daily time</label>
          <input type="time" value={schedule.schedule_time} onChange={(e) => updateTime(e.target.value)} />
          <label>Batch size</label>
          <select value={schedule.batch_size} onChange={(e) => updateBatchSize(Number(e.target.value))}>
            {[1, 5, 10, 25, 50, 75, 100, 125, 150].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <p>Timezone: {schedule.timezone}</p>
        <p>Max messages/day: {schedule.max_per_day}</p>
        <p>Status: {schedule.enabled ? <span className="badge badge-success">Enabled</span> : <span className="badge badge-warning">Schedule is paused.</span>}</p>
        <p>Next scheduled run: {schedule.next_run_at || 'Not scheduled'}</p>
        <p>Last run: {schedule.last_run_at || 'Never'}</p>
      </div>
    </div>
  );
}
