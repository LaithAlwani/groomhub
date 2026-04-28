import { SignUp } from "@clerk/react";

export default function SignUpView() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <SignUp routing="virtual" />
    </div>
  );
}
