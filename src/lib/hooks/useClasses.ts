import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queries, type Class } from "../db";

export function useClasses() {
  const queryClient = useQueryClient();

  const classesQuery = useQuery({
    queryKey: ["classes"],
    queryFn: () => queries.classes.findAll(),
  });

  const createMutation = useMutation({
    mutationFn: (c: Omit<Class, "id">) => queries.classes.create(c),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Class> }) =>
      queries.classes.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => queries.classes.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });

  return {
    classes: classesQuery.data ?? [],
    isLoading: classesQuery.isLoading,
    createClass: createMutation.mutate,
    updateClass: updateMutation.mutate,
    deleteClass: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
