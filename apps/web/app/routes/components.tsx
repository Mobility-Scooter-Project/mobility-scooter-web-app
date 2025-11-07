// routes/components.tsx
import {
  Calculator,
  Calendar1,
  CalendarIcon,
  Check,
  ChevronsUpDown,
  CreditCard,
  Eye,
  Search,
  Settings,
  Smile,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { Button } from "~/components/Button";
import { Checkbox } from "~/components/Checkbox";
import { FileUpload } from "~/components/FileUpload";
import { OverlayCard } from "~/components/OverlayCard";
import { TextInput } from "~/components/TextInput";
import { format } from "date-fns";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "~/components/ContextMenu";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/popover";
import { DatePickerInput } from "~/components/DatePickerInput";
import { Calendar } from "~/components/Calendar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "~/components/Dropdown";
import type { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";
import { Combobox } from "~/components/Combobox";
import { Toggle } from "~/components/Toggle";

type Checked = DropdownMenuCheckboxItemProps["checked"];

type Framework = { value: string; label: string };
const frameworks: Framework[] = [
  { value: "next.js", label: "Next.js" },
  { value: "react-router", label: "React Router" },
  { value: "sveltekit", label: "SvelteKit" },
  { value: "nuxt.js", label: "Nuxt.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
];

export default function ComponentsPage() {
  const [openOverlay, setOpenOverlay] = useState(false);
  const [openDropdownOverlay, setOpenDropdownOverlay] = useState(false);
  const [date, setDate] = useState<Date>();
  const [dropdownRadioPosition, setDropdownRadioPosition] = useState("top");

  const [showCheckboxOne, setShowCheckboxOne] = useState<Checked>(true);
  const [showCheckboxTwo, setShowCheckboxTwo] = useState<Checked>(false);

  const [fw, setFw] = useState<Framework | null>(null);

  return (
    <div className="bg-card flex p-4.5 gap-9 items-start flex-col rounded-lg w-full max-w-3xl">
      <div className="flex flex-col gap-3">
        <h2 className="text-title-2 font-semibold">Components</h2>
        <p className="text-base">
          Here is a page with all our components. Current set of components are
          the ones in app/components/
        </p>
      </div>

      <div className="flex flex-col gap-4.5 w-full">
        <h3 className="text-base font-semibold">Text Input Variants</h3>
        <TextInput
          label="Default Variant"
          id="text"
          type="text"
          placeholder="Text input..."
          variant="default"
        />
        <TextInput
          label="Form Variant"
          id="text"
          type="text"
          placeholder="Text input..."
          variant="form"
        />
        <TextInput
          id="text"
          type="text"
          placeholder="Text input with no label"
          variant="default"
        />
        <TextInput
          id="text"
          type="text"
          placeholder="Text input left icon"
          variant="default"
        >
          <Search className="size-4 text-accent" />
        </TextInput>
        <TextInput
          id="text"
          type="text"
          placeholder="Text input with right icon"
          variant="default"
          rightElement={<Search className="size-4 mr-4.5 text-accent" />}
        />
        <TextInput
          label="Read Only Label"
          id="text"
          type="text"
          placeholder="Read Only Text"
          readOnly
        />
        <TextInput
          id="text"
          type="text"
          placeholder="Read Only No Label"
          readOnly
        />
      </div>

      <div className="flex flex-col gap-4.5 w-full">
        <h3 className="text-base font-semibold">Toggle Variants</h3>
        <Toggle>Toggle Default</Toggle>
        <Toggle variant={"outline"}>Toggle Outline</Toggle>
      </div>

      <div className="flex flex-col gap-4.5 w-full items-center">
        <h3 className="text-base font-semibold self-start">Button Variants</h3>
        <Button>Default Button</Button>
        <Button variant={"secondary"}>Secondary Button</Button>
        <Button variant={"ghost"}>Ghost Button</Button>
        <Button variant={"outline"}>Outline Button</Button>
        <Button size={"fill"}>Size Fill</Button>
        <Button>
          <Search className="size-4 text-accent" />
          <p>Two Element Button</p>
        </Button>
        <TextInput
          placeholder="Inline Button"
          variant="form"
          type="text"
          rightElement={
            <Button variant={"ghost"} size={"inline"} className="mr-2.5">
              <Eye className="size-4" />
            </Button>
          }
        />
        <Button size={"icon"}>
          <Search className="size-4 text-accent" />
        </Button>
        <Button className="text-label" variant={"link"} size={"none"} asChild>
          <Link to={"/"}>Button Link</Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4.5">
        <h3 className="text-base font-semibold">Checkbox Variants</h3>
        <Checkbox>
          I have read and agree to the Terms and Conditions. I have read and
          agree to the Terms and Conditions. I have read and agree to the Terms
          and Conditions.
        </Checkbox>
        <Checkbox>I have read and agree.</Checkbox>
        <Checkbox />
      </div>

      <div className="flex flex-col gap-4.5 w-full">
        <h3 className="text-base font-semibold">File Upload</h3>
        <FileUpload /> {/* As is, optional label */}
        <FileUpload
          label="File upload single (default)"
          size={180} // sets custom min height, w always full
        />
        <FileUpload
          label="File upload multi"
          size={180}
          type={"multi"} // either "single" or "multi" | default "single"
          acceptedTypes={[".mp4", ".mov", ".avi", ".mpeg", ".webm"]}
        />
      </div>

      <div className="flex w-full flex-col gap-4.5">
        <h3 className="font-semibold">Dropdown</h3>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary">Left Click</Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-60" align="start">
            <DropdownMenuGroup>
              <DropdownMenuItem>
                Menu Item
                {/* <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut> */}
              </DropdownMenuItem>
              <DropdownMenuItem>
                Menu Item With Keyboard Shortcut
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                Menu Item Disabled
                <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
              </DropdownMenuItem>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Submenu List</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="w-52">
                    <DropdownMenuItem>Submenu Item 1</DropdownMenuItem>
                    <DropdownMenuItem>Submenu Item 2</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>More...</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuLabel>Dropdown Menu Label</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setOpenDropdownOverlay(true)}>
                Open Overlay
              </DropdownMenuItem>
              <DropdownMenuItem inset>
                Menu Item Inset
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuCheckboxItem
              checked={showCheckboxOne}
              onCheckedChange={setShowCheckboxOne}
            >
              Status Bar
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={showCheckboxTwo}
              onCheckedChange={setShowCheckboxTwo}
              disabled
            >
              Activity Bar
            </DropdownMenuCheckboxItem>

            <DropdownMenuSeparator />

            <DropdownMenuRadioGroup
              value={dropdownRadioPosition}
              onValueChange={setDropdownRadioPosition}
            >
              <DropdownMenuRadioItem value="top">Top</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="bottom">
                Bottom
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem variant="destructive">
              Destructive
              <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <OverlayCard
          open={openDropdownOverlay}
          onClose={() => setOpenDropdownOverlay(false)}
          title="Overlay From Dropdown"
          cardClassName="max-w-lg"
          bodyClassName="gap-9"
        >
          <Button size={"fill"}>Close</Button>
        </OverlayCard>
      </div>

      <div className="flex w-full flex-col gap-4.5">
        <h3 className="font-semibold">Combobox</h3>

        <Combobox
          items={frameworks}
          value={fw}
          onChange={setFw}
          contentClassName="w-52"
        >
          <Button variant="outline" className="w-52 justify-between">
            {fw ? fw.label : "Select framework"}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </Combobox>
      </div>

      <div className="flex w-full flex-col gap-4.5">
        <h3 className="font-semibold">Date Picker</h3>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              data-empty={!date}
              size={"default"}
              className="data-[empty=true]:text-foreground w-60 justify-start"
            >
              <CalendarIcon />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={date} onSelect={setDate} />
          </PopoverContent>
        </Popover>

        <DatePickerInput />
      </div>

      <div className="flex w-full flex-col gap-4.5">
        <h3 className="font-semibold">Context Menu</h3>

        <ContextMenu>
          <ContextMenuTrigger asChild>
            <Button variant="secondary">Right Click</Button>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-60">
            <ContextMenuItem inset>
              Menu Item
              {/* <ContextMenuShortcut>⌘[</ContextMenuShortcut> */}
            </ContextMenuItem>
            <ContextMenuItem inset disabled>
              Item Disabled
              <ContextMenuShortcut>⌘]</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem inset>
              Item with Shortcut Newline
              <ContextMenuShortcut>⌘R</ContextMenuShortcut>
            </ContextMenuItem>

            <ContextMenuSub>
              <ContextMenuSubTrigger inset>More Tools</ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-52">
                <ContextMenuItem>Submenu Item</ContextMenuItem>
                <ContextMenuItem>Submenu Item 2</ContextMenuItem>
                <ContextMenuItem>Submenu Item 3</ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem>Submenu Item 4</ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem variant="destructive">
                  Destructive Item
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSeparator />

            <ContextMenuItem>
              Item without inset
              <ContextMenuShortcut>⌘R</ContextMenuShortcut>
            </ContextMenuItem>

            <ContextMenuSeparator />

            <ContextMenuCheckboxItem checked>
              Checkbox Item Checked
            </ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem>
              Checkbox Item Unchecked
            </ContextMenuCheckboxItem>

            <ContextMenuSeparator />

            <ContextMenuRadioGroup value="selected">
              <ContextMenuLabel inset>Radio Items Label</ContextMenuLabel>
              <ContextMenuRadioItem value="selected">
                Radio Item Selected
              </ContextMenuRadioItem>
              <ContextMenuRadioItem value="deselected">
                Radio Item
              </ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuContent>
        </ContextMenu>
      </div>

      <div className="flex w-full flex-col gap-4.5">
        <h3 className="font-semibold">Overlay</h3>
        <Button onClick={() => setOpenOverlay(true)}>Open Overlay</Button>

        <OverlayCard
          open={openOverlay}
          onClose={() => setOpenOverlay(false)}
          title="Overlay Card Dialog"
          subtitle="Invite a team member to join your organization. The recipient will get a one-time magic link to create their account. Embedded information will not be editable by recipient."
          contentClassName="max-w-3xl"
          bodyClassName="gap-9"
        >
          <TextInput variant="form" label="Email" />
          <Button size={"fill"}>Submit</Button>
        </OverlayCard>
      </div>
    </div>
  );
}
