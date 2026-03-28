import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSiteContent() {
  const [content, setContent] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.from("site_content").select("key, value").then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((row: any) => { map[row.key] = row.value; });
        setContent(map);
      }
    });
  }, []);

  return content;
}
