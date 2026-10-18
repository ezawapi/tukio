import { Label } from "@/components/ui/label";
import { useSubCategories } from "@/hooks/use-sub-categories";

interface Props {
  categoryId?: string;
  value?: string[];
  onChange: (ids: string[]) => void;
}

/** Multi-select chips of the sub-categories belonging to the chosen main category. */
const SubCategoryPicker = ({ categoryId, value = [], onChange }: Props) => {
  const { data: all = [] } = useSubCategories();
  if (!categoryId) return null;
  const options = all.filter((sc) => sc.category_id === categoryId);
  if (options.length === 0) return null;
  const selected = Array.isArray(value) ? value : [];

  return (
    <div className="space-y-2 sm:col-span-2">
      <Label className="font-body">Sous-catégories (une ou plusieurs)</Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((sc) => {
          const on = selected.includes(sc.id);
          return (
            <button
              type="button"
              key={sc.id}
              aria-pressed={on}
              onClick={() => onChange(on ? selected.filter((x) => x !== sc.id) : [...selected, sc.id])}
              className={`rounded-full border px-2.5 py-1 font-body text-xs transition-colors ${
                on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted"
              }`}
            >
              {sc.name}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">Facultatif — précise le type d'activité, affiché sur la fiche.</p>
    </div>
  );
};

export default SubCategoryPicker;
