import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queries, type Payment } from "../db";

export function useFinance(studentId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["payments", studentId],
    queryFn: () => queries.finance.getPayments(studentId),
  });

  const recordMutation = useMutation({
    mutationFn: (payment: Omit<Payment, "id">) => queries.finance.recordPayment(payment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });

  return {
    payments: query.data ?? [],
    isLoading: query.isLoading,
    recordPayment: recordMutation.mutate,
    isRecording: recordMutation.isPending,
  };
}
