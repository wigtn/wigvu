"use client";

import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center">
            <XCircle className="w-12 h-12 text-destructive" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold">
            Payment Cancelled
          </h1>
          <p className="text-muted-foreground">
            Your payment was cancelled. You can try again anytime.
          </p>
        </div>

        <div className="pt-4 space-y-3">
          <button
            onClick={() => router.push("/#pricing")}
            className="btn-primary w-full"
          >
            View Plans
          </button>
          <button
            onClick={() => router.push("/")}
            className="btn-ghost w-full"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
