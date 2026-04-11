import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queries, type Subject, type Attendance, type Mark, type TeacherAssignment } from "../db";

export function useSubjects() {
  const queryClient = useQueryClient();

  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: () => queries.subjects.findAll(),
  });

  const createMutation = useMutation({
    mutationFn: (subject: Omit<Subject, "id">) => queries.subjects.create(subject),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => queries.subjects.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });

  return {
    subjects: subjectsQuery.data ?? [],
    isLoading: subjectsQuery.isLoading,
    createSubject: createMutation.mutate,
    deleteSubject: deleteMutation.mutate,
  };
}

export function useAttendance(className: string, date: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["attendance", className, date],
    queryFn: () => queries.academic.getAttendance(className, date),
    enabled: !!className && !!date,
  });

  const recordMutation = useMutation({
    mutationFn: (attendance: Omit<Attendance, "id">) => queries.academic.recordAttendance(attendance),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", className, date] });
    },
  });

  return {
    attendance: query.data ?? [],
    isLoading: query.isLoading,
    recordAttendance: recordMutation.mutate,
  };
}

export function useMarks(studentId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["marks", studentId],
    queryFn: () => queries.academic.getMarks(studentId),
    enabled: !!studentId,
  });

  const recordMutation = useMutation({
    mutationFn: (mark: Omit<Mark, "id" | "total_mark">) => queries.academic.recordMarks(mark),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marks", studentId] });
    },
  });

  return {
    marks: query.data ?? [],
    isLoading: query.isLoading,
    recordMarks: recordMutation.mutate,
  };
}

export function useTeacherAssignment() {
  const queryClient = useQueryClient();

  const assignMutation = useMutation({
    mutationFn: (assignment: Omit<TeacherAssignment, "id">) => queries.academic.assignTeacher(assignment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher_assignments"] });
    },
  });

  return {
    assignTeacher: assignMutation.mutate,
  };
}
