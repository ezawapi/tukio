import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export type SortKey = "date_desc" | "date_asc" | "popularity" | "status";

interface Props {
  search: string;
  onSearch: (v: string) => void;
  city: string;
  onCity: (v: string) => void;
  cities: string[];
  sort: SortKey;
  onSort: (v: SortKey) => void;
  showStatusSort?: boolean;
  showPopularitySort?: boolean;
  groupByEvent?: boolean;
  onGroupByEvent?: (v: boolean) => void;
}

const DashboardFilters = ({
  search, onSearch, city, onCity, cities, sort, onSort,
  showStatusSort = true, showPopularitySort = true,
  groupByEvent, onGroupByEvent,
}: Props) => {
  const hasActive = search || city !== "all" || sort !== "date_desc";
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center mb-3">
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Rechercher…" className="h-9 pl-8 text-sm" />
      </div>
      <Select value={city} onValueChange={onCity}>
        <SelectTrigger className="h-9 w-full sm:w-[150px] text-sm"><SelectValue placeholder="Ville" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes les villes</SelectItem>
          {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={sort} onValueChange={(v) => onSort(v as SortKey)}>
        <SelectTrigger className="h-9 w-full sm:w-[170px] text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="date_desc">Date (récent)</SelectItem>
          <SelectItem value="date_asc">Date (ancien)</SelectItem>
          {showPopularitySort && <SelectItem value="popularity">Popularité</SelectItem>}
          {showStatusSort && <SelectItem value="status">Statut</SelectItem>}
        </SelectContent>
      </Select>
      {onGroupByEvent && (
        <Button
          type="button"
          variant={groupByEvent ? "default" : "outline"}
          size="sm"
          onClick={() => onGroupByEvent(!groupByEvent)}
          className="h-9"
        >
          {groupByEvent ? "Groupé" : "Grouper par événement"}
        </Button>
      )}
      {hasActive && (
        <Button type="button" variant="ghost" size="sm" onClick={() => { onSearch(""); onCity("all"); onSort("date_desc"); }} className="h-9 gap-1">
          <X className="h-3.5 w-3.5" /> Réinitialiser
        </Button>
      )}
    </div>
  );
};

export default DashboardFilters;
