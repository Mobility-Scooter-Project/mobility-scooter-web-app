import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  type ActionFunctionArgs,
} from "react-router";
import { useEffect, useState } from "react";
import { Button } from "~/components/Button";
import { DropdownField, type DropdownOption } from "~/components/Dropdown";
import { TextInput } from "~/components/TextInput";
import { API_BASE_URL } from "~/config/constants";

export type JoinSignupOrgOption = {
  id: string;
  name: string;
  units: { id: string; name: string }[];
};

export async function clientLoader(): Promise<{
  orgs: JoinSignupOrgOption[];
  loadError?: string;
}> {
  const url = `${API_BASE_URL}/api/v1/organizations/join-signup-options`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      if (import.meta.env.DEV) {
        console.warn(
          `[join-org-app] organizations request failed: ${res.status} ${res.statusText}`,
          url,
        );
      }
      return { orgs: [], loadError: "Could not load organizations." };
    }
    const data = (await res.json()) as { orgs?: JoinSignupOrgOption[] };
    return { orgs: data.orgs ?? [] };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("[join-org-app] organizations request error", url, err);
    }
    return { orgs: [], loadError: "Could not load organizations." };
  }
}

type ActionSuccess = {
  success: true;
  message: string;
  /** Only when API outbound email is off (local development). */
  completeToken?: string;
};
type ActionError = { error: string };
type ActionData = ActionSuccess | ActionError | undefined;

/** Must match `USER_ROLES` in the API (`lead`, `researcher`, `trainee`, `admin`). */
const INTENDED_ROLE_OPTIONS: DropdownOption[] = [
  { value: "", label: "No preference" },
  { value: "lead", label: "Lead" },
  { value: "researcher", label: "Researcher" },
  { value: "trainee", label: "Trainee" },
  { value: "admin", label: "Admin" },
];

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const givenName = (formData.get("givenName") as string)?.trim() ?? "";
  const surname = (formData.get("surname") as string)?.trim() ?? "";
  const email = (formData.get("email") as string)?.trim() ?? "";
  const orgId = (formData.get("orgId") as string)?.trim() ?? "";
  const unitId = (formData.get("unitId") as string)?.trim() ?? "";
  const intendedRole = (formData.get("intendedRole") as string)?.trim() ?? "";

  if (!email) {
    return { error: "Enter your email address." };
  }

  if (!orgId || !unitId) {
    return { error: "Please select an organization and a unit." };
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/auth/email/sign-up/join-org`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          orgId,
          unitId,
          givenName: givenName || undefined,
          surname: surname || undefined,
          intendedRole: intendedRole || undefined,
        }),
      },
    );

    if (!response.ok) {
      let message = "Could not submit your application.";
      try {
        const err = await response.json();
        if (typeof err.message === "string") {
          message = Array.isArray(err.message)
            ? err.message.join(", ")
            : err.message;
        }
      } catch {
        /* ignore */
      }
      return { error: message };
    }

    const data = (await response.json()) as {
      message?: string;
      completeToken?: string;
    };

    return {
      success: true as const,
      message:
        typeof data.message === "string" && data.message.length > 0
          ? data.message
          : "Application submitted.",
      completeToken:
        typeof data.completeToken === "string" ? data.completeToken : undefined,
    };
  } catch {
    return { error: "Network error occurred." };
  }
}

export default function JoinOrgAppPage() {
  const { orgs, loadError } = useLoaderData() as {
    orgs: JoinSignupOrgOption[];
    loadError?: string;
  };
  const actionData = useActionData() as ActionData;

  const [email, setEmail] = useState("");
  const [intendedRole, setIntendedRole] = useState("");
  const [orgId, setOrgId] = useState("");
  const [unitId, setUnitId] = useState("");

  const orgOptions: DropdownOption[] = orgs.map((org) => ({
    value: org.id,
    label: org.name,
  }));
  const unitsResolved = orgs.find((o) => o.id === orgId)?.units ?? [];
  const unitOptions: DropdownOption[] = unitsResolved.map((unit) => ({
    value: unit.id,
    label: unit.name,
  }));

  useEffect(() => {
    setUnitId("");
  }, [orgId]);

  const canSubmit =
    email.trim().length > 0 &&
    orgs.length > 0 &&
    orgId.length > 0 &&
    unitId.length > 0;

  if (actionData && "success" in actionData && actionData.success) {
    return (
      <main className="bg-card flex p-4.5 gap-9 flex-col rounded-lg w-full max-w-3xl justify-start items-start">
        <div className="flex flex-col gap-3">
          <h2 className="text-title-2 font-semibold">Application submitted</h2>
          <p className="text-base text-muted-foreground">{actionData.message}</p>
          {actionData.completeToken ? (
            <div className="flex flex-col gap-2 rounded-md border border-accent p-3">
              <p className="text-sm text-muted-foreground">
                Email is not configured on the API. For local development, open this
                link to set your password (same email as on the application):
              </p>
              <Button variant="link" size="none" className="text-label self-start" asChild>
                <a
                  href={`/create-account?token=${encodeURIComponent(actionData.completeToken)}`}
                >
                  Open "set password" page
                </a>
              </Button>
            </div>
          ) : null}
        </div>
        <Button variant="link" size="none" className="text-label self-start" asChild>
          <Link to="/login">Go to sign in</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="bg-card flex p-4.5 gap-9 flex-col rounded-lg w-full max-w-3xl justify-start items-start">
      <div className="flex flex-col gap-3">
        <h2 className="text-title-2 font-semibold">
          Request to Join Organization
        </h2>
        <p>
          Request access to your organization's workspace. Once approved, you'll
          get a one-time magic link to register your account.
        </p>
      </div>

      {loadError && (
        <p role="alert" className="text-base text-destructive">
          {loadError}
        </p>
      )}

      {orgs.length === 0 && !loadError && (
        <p role="status" className="text-base text-muted-foreground">
          No organizations are available yet. Ask an administrator to seed the
          database or create your tenant.
        </p>
      )}

      <Form method="post" className="flex w-full flex-col gap-9">
        <div className="flex w-full flex-col gap-4.5">
          <h3 className="font-semibold">Your details</h3>
          <div className="flex flex-col gap-3">
            <TextInput
              label="First name"
              id="givenName"
              name="givenName"
              type="text"
              placeholder="First name"
              variant="form"
            />
            <TextInput
              label="Last name"
              id="surname"
              name="surname"
              type="text"
              placeholder="Last name"
              variant="form"
            />
            <TextInput
              label="Email"
              id="email"
              name="email"
              type="email"
              placeholder="Work email"
              variant="form"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <DropdownField
              id="intendedRole"
              label="Intended role (optional)"
              name="intendedRole"
              value={intendedRole}
              onValueChange={setIntendedRole}
              options={INTENDED_ROLE_OPTIONS}
            />
          </div>
        </div>

        <div className="flex w-full flex-col gap-4.5">
          <h3 className="font-semibold">Organization</h3>
          <div className="flex flex-col gap-3">
            <DropdownField
              id="orgId"
              label="Organization"
              name="orgId"
              value={orgId}
              onValueChange={setOrgId}
              options={orgOptions}
              placeholder="Select organization..."
              required
              disabled={orgOptions.length === 0}
            />

            {orgId ? (
              <DropdownField
                id="unitId"
                label="Unit"
                name="unitId"
                value={unitId}
                onValueChange={setUnitId}
                options={unitOptions}
                placeholder={
                  unitOptions.length > 0 ? "Select unit..." : "No units available"
                }
                emptyText="No units available."
                required
                disabled={unitOptions.length === 0}
              />
            ) : null}
          </div>
        </div>

        {actionData && "error" in actionData && actionData.error && (
          <p role="alert" className="text-base text-destructive">
            {actionData.error}
          </p>
        )}

        {/* Hidden until create-org flow is ready
        <Button className="text-label" variant={"link"} size={"none"} asChild>
          <Link to={"/create-org-app"}>
            Need to create a new organization instead?
          </Link>
        </Button>
        */}

        <Button size={"fill"} type="submit" disabled={!canSubmit}>
          Submit application
        </Button>
      </Form>
    </main>
  );
}
