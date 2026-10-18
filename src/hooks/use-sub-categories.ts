import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SubCategory {
  id: string;
  category_id: string;
  name: string;
}

/** All sub-categories (small list, cached). Filter by category_id client-side. */
export const useSubCategories = () =>
  useQuery({
    queryKey: ["sub-categories"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<SubCategory[]> => {
      const { data, error } = await supabase
        .from("sub_categories")
        .select("id, category_id, name")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });
