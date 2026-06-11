import { useMemo, useState, type FormEvent } from 'react';
import { TASK_STATUSES, type Task, type TaskInput, type TaskStatus } from '@/db/taskMapping';
import { deferFriction, evaluateScheduleToday, isTwoMinuteTask } from '@/domain/antiProcrastination';
import { t } from '@/lib/i18n';
import {
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useTasksQuery,
  useUpdateTaskMutation,
} from './tasksQueries';

const cardStyle = {
  border: '1px solid var(--color-border)',
  borderRadius: '0.5rem',
  padding: '0.75rem',
  background: 'var(--color-bg-elevated)',
  display: 'grid',
  gap: '0.5rem',
} as const;

const inputStyle = {
  background: 'var(--color-bg)',
  color: 'var(--color-text)',
  border: '1px solid var(--color-border)',
  borderRadius: '0.4rem',
  padding: '0.35rem 0.5rem',
} as const;

interface TaskRowProps {
  task: Task;
  subtaskCount: number;
  onPatch: (patch: TaskInput) => void;
  onDelete: () => void;
}

function TaskRow({ task, subtaskCount, onPatch, onDelete }: TaskRowProps) {
  const [title, setTitle] = useState(task.title);
  const [estimate, setEstimate] = useState(task.estimateMin?.toString() ?? '');
  const [intention, setIntention] = useState(task.implementationIntention ?? '');
  const [blockMessage, setBlockMessage] = useState<string | null>(null);

  const estimateValue = estimate.trim() === '' ? null : Number(estimate);
  const defer = deferFriction(task.deferCount);

  const tryStart = (): void => {
    const evaluation = evaluateScheduleToday({
      estimateMin: estimateValue !== null && Number.isFinite(estimateValue) ? estimateValue : null,
      implementationIntention: intention.trim() === '' ? null : intention,
      subtaskCount,
      deferCount: task.deferCount,
    });
    if (evaluation === 'needs-decomposition') {
      setBlockMessage(t('tasks.blockDecompose'));
      return;
    }
    if (evaluation === 'needs-intention') {
      setBlockMessage(t('tasks.blockIntention'));
      return;
    }
    setBlockMessage(null);
    onPatch({ status: 'doing' });
  };

  const onStatusChange = (next: TaskStatus): void => {
    if (next === 'doing') {
      tryStart();
      return;
    }
    setBlockMessage(null);
    onPatch({ status: next });
  };

  return (
    <li style={cardStyle}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input
          aria-label={t('tasks.titleLabel')}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={() => {
            if (title !== task.title) onPatch({ title });
          }}
          style={{ ...inputStyle, flex: 1 }}
        />
        <select
          aria-label={t('tasks.statusLabel')}
          value={task.status}
          onChange={(event) => onStatusChange(event.target.value as TaskStatus)}
          style={inputStyle}
        >
          {TASK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {t(`tasks.status.${status}`)}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onDelete}
          style={{ ...inputStyle, color: 'var(--color-danger)', cursor: 'pointer' }}
        >
          {t('tasks.delete')}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            {t('tasks.estimate')}
          </span>
          <input
            type="number"
            min={0}
            value={estimate}
            onChange={(event) => setEstimate(event.target.value)}
            onBlur={() => {
              const next =
                estimateValue !== null && Number.isFinite(estimateValue) ? estimateValue : null;
              if (next !== task.estimateMin) onPatch({ estimateMin: next });
            }}
            style={{ ...inputStyle, width: '5rem' }}
          />
        </label>
        <input
          aria-label={t('tasks.intention')}
          placeholder={t('tasks.intention')}
          value={intention}
          onChange={(event) => setIntention(event.target.value)}
          onBlur={() => {
            const next = intention.trim() === '' ? null : intention;
            if (next !== task.implementationIntention) onPatch({ implementationIntention: next });
          }}
          style={{ ...inputStyle, flex: 1, minWidth: '8rem' }}
        />
        {task.status !== 'doing' && task.status !== 'done' && (
          <button
            type="button"
            onClick={tryStart}
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-primary-contrast)',
              border: 'none',
              borderRadius: '0.4rem',
              padding: '0.35rem 0.7rem',
              cursor: 'pointer',
            }}
          >
            {t('tasks.start')}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {blockMessage !== null && (
          <span role="alert" style={{ color: 'var(--color-warning)', fontSize: '0.85rem' }}>
            {blockMessage}
          </span>
        )}
        {isTwoMinuteTask(estimateValue) && (
          <span style={{ color: 'var(--color-success)', fontSize: '0.85rem' }}>
            {t('tasks.twoMinute')}
          </span>
        )}
        {task.deferCount > 0 && (
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            {t('tasks.deferLabel')} {task.deferCount}×
            {defer.suggestBreakdown ? ` — ${t('tasks.suggestBreakdown')}` : ''}
          </span>
        )}
      </div>
    </li>
  );
}

export default function TasksPage() {
  const tasksQuery = useTasksQuery();
  const createTask = useCreateTaskMutation();
  const updateTask = useUpdateTaskMutation();
  const deleteTask = useDeleteTaskMutation();
  const [capture, setCapture] = useState('');

  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data]);
  const topLevel = useMemo(() => tasks.filter((task) => task.parentTaskId === null), [tasks]);
  const subtaskCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const task of tasks) {
      if (task.parentTaskId !== null) {
        counts.set(task.parentTaskId, (counts.get(task.parentTaskId) ?? 0) + 1);
      }
    }
    return counts;
  }, [tasks]);

  const submitCapture = (event: FormEvent): void => {
    event.preventDefault();
    const title = capture.trim();
    if (title === '') return;
    createTask.mutate({ title, status: 'inbox' });
    setCapture('');
  };

  return (
    <section style={{ maxWidth: '48rem' }}>
      <h1>{t('tasks.title')}</h1>

      <form onSubmit={submitCapture} style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
        <input
          value={capture}
          onChange={(event) => setCapture(event.target.value)}
          placeholder={t('tasks.capturePlaceholder')}
          aria-label={t('tasks.capturePlaceholder')}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button
          type="submit"
          style={{
            background: 'var(--color-primary)',
            color: 'var(--color-primary-contrast)',
            border: 'none',
            borderRadius: '0.4rem',
            padding: '0.5rem 0.9rem',
            cursor: 'pointer',
          }}
        >
          {t('tasks.add')}
        </button>
      </form>

      {tasksQuery.isLoading && <p>{t('app.loading')}</p>}
      {tasksQuery.isError && <p role="alert">{t('tasks.loadError')}</p>}
      {!tasksQuery.isLoading && topLevel.length === 0 && (
        <p style={{ color: 'var(--color-text-muted)' }}>{t('tasks.empty')}</p>
      )}

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.6rem' }}>
        {topLevel.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            subtaskCount={subtaskCounts.get(task.id) ?? 0}
            onPatch={(patch) => updateTask.mutate({ id: task.id, patch })}
            onDelete={() => deleteTask.mutate(task.id)}
          />
        ))}
      </ul>
    </section>
  );
}
