import { Breed, TRAIT_FIELDS } from "@/lib/breeds";

interface TraitCompareTableProps {
  breeds: Breed[];
}

/** Side-by-side trait bars for 2+ breeds. Reused by the results page's
 * "compare traits" view and the /breeds comparison tray. */
export function TraitCompareTable({ breeds }: TraitCompareTableProps) {
  return (
    <div className="overflow-x-auto rounded-3xl border-3 border-border bg-surface p-4 shadow-hard sm:p-6">
      <table className="w-full min-w-[480px] border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className="w-40 pb-4 text-left align-bottom">
              <span className="sr-only">Trait</span>
            </th>
            {breeds.map((breed) => (
              <th
                key={breed.id}
                scope="col"
                className="px-2 pb-4 text-left align-bottom font-display text-sm font-semibold text-text"
              >
                <span aria-hidden="true" className="mr-1 text-lg">
                  {breed.emoji}
                </span>
                {breed.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TRAIT_FIELDS.map((field) => (
            <tr key={field.key}>
              <th
                scope="row"
                className="flex items-center gap-1.5 py-2 pr-3 text-left text-xs font-bold text-muted"
              >
                <span aria-hidden="true">{field.icon}</span>
                {field.label}
              </th>
              {breeds.map((breed) => {
                const value = breed[field.key] as number;
                return (
                  <td key={breed.id} className="px-2 py-2 align-middle">
                    <div
                      className="h-2.5 w-full min-w-16 overflow-hidden rounded-full border-2 border-border bg-background-alt"
                      role="img"
                      aria-label={`${breed.name} ${field.label}: ${value} out of 5`}
                    >
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(value / 5) * 100}%` }}
                      />
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
