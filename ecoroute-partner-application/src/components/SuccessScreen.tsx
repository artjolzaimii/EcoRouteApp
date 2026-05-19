export default function SuccessScreen() {
  return (
    <div className="min-h-screen bg-brand-pale flex flex-col items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-6">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2d8653" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="M22 4L12 14.01l-3-3" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">Application Submitted!</h1>
        <p className="text-gray-500 text-sm mb-6">
          Thank you for applying to become an EcoRoute partner. Our team will review your
          application and reach out within <strong className="text-gray-700">2–3 business days</strong>.
        </p>

        <div className="bg-brand-light border border-brand/20 rounded-xl p-4 text-sm text-left space-y-3">
          {[
            { icon: "✓", text: "Application received and queued for review" },
            { icon: "→", text: "Our team will verify your business details" },
            { icon: "→", text: "You'll receive an email confirmation shortly" },
            { icon: "→", text: "Once approved, you'll appear on EcoRoute's partner map" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-start gap-2.5">
              <span className="text-brand font-bold text-base leading-tight">{icon}</span>
              <span className="text-gray-600">{text}</span>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-gray-400">
          Questions?{" "}
          <a href="mailto:partners@ecoroute.app" className="text-brand hover:underline">
            Contact our partner team
          </a>
        </p>
      </div>
    </div>
  );
}
