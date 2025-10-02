import { Icon } from "~/components/ui/icon";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

interface SearchInputProps extends React.ComponentProps<"input"> {}

// proof of concept, not final
export function SearchInput({ className, ...props }: SearchInputProps) {
  return (
    <div className="relative">
      <Icon
        name="Search"
        size="secondary"
        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
      <Input className={cn("pl-9", className)} {...props} />
    </div>
  );
}
