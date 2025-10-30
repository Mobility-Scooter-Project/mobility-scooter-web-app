// routes/joinorgapp.tsx

export default function CreateOrgAppPage() {
  return (
    <main className="bg-card flex my-auto p-4.5 gap-9 flex-col rounded-lg w-full max-w-3xl items-start">
      <div className="flex flex-col gap-3">
        <h2 className="text-title-2 font-semibold">Create Organization</h2>
        <p className="text-base">
          Your organization details have been verified. Please confirm your
          information to finish setting up your account.
        </p>
      </div>

      <div className="flex w-full flex-col gap-4.5">
        <h3 className="text-base font-semibold">Applicant Information</h3>
        <div className="flex flex-row h-10 w-full pl-4.5 gap-3 items-center justify-start">
          <p className="text-base">Pee pee poo poo medical center</p>
        </div>
      </div>
    </main>
  );
}
