import { Link } from "react-router";
import { Button } from "~/components/Button";
import { TextInput } from "~/components/TextInput";

export default function ForgotPasswordPage() {
  return (
    <main className="bg-card flex p-4.5 gap-9 flex-col rounded-lg w-full max-w-lg">
      <div className="flex flex-col gap-3">
        <h2 className="text-title-2 font-semibold">Forgot Password</h2>
        <p>Enter your email, and we’ll send you a one-time reset link.</p>
      </div>

      <TextInput
        label="Email"
        id="email"
        type="email"
        placeholder="Enter email..."
        variant="form"
      />

      <Button size={"fill"} asChild>
        <Link to={"/reset-password"}>Send Reset Link</Link>
      </Button>
    </main>
  );
}
