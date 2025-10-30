// routes/components.tsx
import { Search } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/Button";
import { Checkbox } from "~/components/Checkbox";
import { TextInput } from "~/components/TextInput";

export default function ComponentsPage() {
  return (
    <div className="bg-card flex p-4.5 gap-9 items-start flex-col rounded-lg w-full max-w-md">
      <div className="flex flex-col gap-3">
        <h2 className="text-title-2 font-semibold">Components</h2>
        <p className="text-base">Here is a page with all our components.</p>
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
      </div>

      <div className="flex flex-col gap-4.5 w-full items-center">
        <h3 className="text-base font-semibold self-start">Button Variants</h3>
        <Button>Default Button</Button>
        <Button variant={"secondary"}>Secondary Button</Button>
        <Button variant={"inline"}>Inline Button</Button>
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
    </div>
  );
}
