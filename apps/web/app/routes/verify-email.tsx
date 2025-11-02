import { Link } from "react-router";
import { Button } from "~/components/Button";

export default function VerifyEmailPage() {
  return (
    <div className="bg-card flex p-4.5 gap-9 flex-col rounded-lg w-full max-w-[480px]">
      <div>
        <h2 className="text-title-2 font-semibold mb-3">Verify Your Email</h2>
        <p className="text-muted-foreground">
          We’ve sent a verification link to your email. Click the link to verify
          your address and submit your application for review.
        </p>
      </div>

      <Button asChild>
        <Link to={"/"}>Return Home</Link>
      </Button>
    </div>
  );
}
