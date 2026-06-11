import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as tasksRepo from '@/db/tasksRepo';
import type { Task, TaskInput } from '@/db/taskMapping';
import { logError } from '@/lib/logger';
import { tasksKeys } from './queryKeys';

export function useTasksQuery() {
  return useQuery({ queryKey: tasksKeys.list(), queryFn: tasksRepo.listTasks });
}

function applyPatch(task: Task, patch: TaskInput): Task {
  return {
    ...task,
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
    ...(patch.estimateMin !== undefined ? { estimateMin: patch.estimateMin } : {}),
    ...(patch.spentMin !== undefined ? { spentMin: patch.spentMin } : {}),
    ...(patch.due !== undefined ? { due: patch.due } : {}),
    ...(patch.implementationIntention !== undefined
      ? { implementationIntention: patch.implementationIntention }
      : {}),
    ...(patch.deferCount !== undefined ? { deferCount: patch.deferCount } : {}),
    ...(patch.goalId !== undefined ? { goalId: patch.goalId } : {}),
    ...(patch.recurrence !== undefined ? { recurrence: patch.recurrence } : {}),
  };
}

export function useCreateTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TaskInput) => tasksRepo.createTask(input),
    onSuccess: (task) => {
      queryClient.setQueryData<Task[]>(tasksKeys.list(), (prev) => [task, ...(prev ?? [])]);
    },
  });
}

interface UpdateVars {
  id: string;
  patch: TaskInput;
}

export function useUpdateTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: UpdateVars) => tasksRepo.updateTask(id, patch),
    onMutate: async ({ id, patch }: UpdateVars) => {
      await queryClient.cancelQueries({ queryKey: tasksKeys.list() });
      const previous = queryClient.getQueryData<Task[]>(tasksKeys.list());
      queryClient.setQueryData<Task[]>(tasksKeys.list(), (prev) =>
        (prev ?? []).map((task) => (task.id === id ? applyPatch(task, patch) : task)),
      );
      return { previous };
    },
    onError: (error, _vars, context) => {
      logError(error, { scope: 'updateTask' });
      if (context?.previous) {
        queryClient.setQueryData(tasksKeys.list(), context.previous);
      }
    },
    onSuccess: (task) => {
      queryClient.setQueryData<Task[]>(tasksKeys.list(), (prev) =>
        (prev ?? []).map((existing) => (existing.id === task.id ? task : existing)),
      );
    },
  });
}

export function useDeleteTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksRepo.deleteTask(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: tasksKeys.list() });
      const previous = queryClient.getQueryData<Task[]>(tasksKeys.list());
      queryClient.setQueryData<Task[]>(tasksKeys.list(), (prev) =>
        (prev ?? []).filter((task) => task.id !== id),
      );
      return { previous };
    },
    onError: (error, _id, context) => {
      logError(error, { scope: 'deleteTask' });
      if (context?.previous) {
        queryClient.setQueryData(tasksKeys.list(), context.previous);
      }
    },
  });
}
