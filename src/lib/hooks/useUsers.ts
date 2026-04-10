import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queries, type NewUser } from "../db";

export function useUsers() {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => queries.users.findAll(),
  });

  const createMutation = useMutation({
    mutationFn: (user: NewUser) => queries.users.create(user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      console.error("Create mutation error:", error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<NewUser, "password">> }) =>
      queries.users.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      console.error("Update mutation error:", error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => queries.users.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      console.error("Delete mutation error:", error);
    },
  });

  return {
    users: usersQuery.data ?? [],
    isLoading: usersQuery.isLoading,
    error: usersQuery.error,
    refetch: usersQuery.refetch,
    createUser: createMutation.mutate,
    updateUser: updateMutation.mutate,
    deleteUser: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  };
}

export function useUser(id: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["user", id],
    queryFn: () => queries.users.findById(id),
    enabled: !!id,
  });

  return {
    ...query,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["user", id] }),
  };
}
