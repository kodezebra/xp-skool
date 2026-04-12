import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queries, type Payment } from "../db";
import { DEFAULT_FEE_CATEGORIES } from "../utils";

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
      queryClient.invalidateQueries({ queryKey: ["outstanding"] });
    },
  });

  return {
    payments: query.data ?? [],
    isLoading: query.isLoading,
    recordPayment: recordMutation.mutate,
    isRecording: recordMutation.isPending,
  };
}

export function useFeeCategories() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["fee_categories"],
    queryFn: async () => {
      const setting = await queries.settings.findByKey("fee_categories");
      if (setting?.value) {
        try {
          return JSON.parse(setting.value) as string[];
        } catch (e) {
          return DEFAULT_FEE_CATEGORIES;
        }
      }
      return DEFAULT_FEE_CATEGORIES;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (categories: string[]) => 
      queries.settings.upsert("fee_categories", JSON.stringify(categories)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee_categories"] });
    },
  });

  return {
    categories: query.data ?? DEFAULT_FEE_CATEGORIES,
    isLoading: query.isLoading,
    updateCategories: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}
