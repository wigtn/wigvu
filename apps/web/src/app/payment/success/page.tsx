"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // URL 파라미터에서 결제 정보 확인 (Klaim이 전달하는 경우)
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      // 여기서 서버에 결제 확인 요청을 보낼 수 있습니다
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-success" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold">
            Payment Complete!
          </h1>
          <p className="text-muted-foreground">
            Your subscription has been activated successfully.
          </p>
        </div>

        <div className="pt-4 space-y-3">
          <button
            onClick={() => router.push("/")}
            className="btn-primary w-full"
          >
            Back to Home
          </button>
          <button
            onClick={() => router.push("/analyze")}
            className="btn-ghost w-full"
          >
            Start Analyzing Videos
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
