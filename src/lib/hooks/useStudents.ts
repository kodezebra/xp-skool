import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queries, type Student } from "../db";

export function useStudents() {
  const queryClient = useQueryClient();

  const studentsQuery = useQuery({
    queryKey: ["students"],
    queryFn: () => queries.students.findAll(),
  });

  const createMutation = useMutation({
    mutationFn: (student: Omit<Student, "id" | "created_at" | "updated_at">) =>
      queries.students.create(student),
    onSuccess: async (newStudent) => {
      await queries.students.assignDefaultSubjectsByClass(newStudent.id, newStudent.current_class);
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Student> }) =>
      queries.students.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["student"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => queries.students.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });

  return {
    students: studentsQuery.data ?? [],
    isLoading: studentsQuery.isLoading,
    error: studentsQuery.error,
    createStudent: createMutation.mutate,
    updateStudent: updateMutation.mutate,
    deleteStudent: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: ["student", id],
    queryFn: () => queries.students.findById(id),
    enabled: !!id,
  });
}
