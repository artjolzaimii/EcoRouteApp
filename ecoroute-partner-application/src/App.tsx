import { useState } from "react";
import StepIndicator from "./components/StepIndicator";
import SuccessScreen from "./components/SuccessScreen";
import MapPicker from "./components/MapPicker";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3000";

const CATEGORIES = [
  { value: "FOOD", label: "Food & Beverage" },
  { value: "RETAIL", label: "Retail" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "FITNESS", label: "Fitness" },
  { value: "WELLNESS", label: "Wellness" },
  { value: "ENTERTAINMENT", label: "Entertainment" },
  { value: "OTHER", label: "Other" },
];

const PARTNER_TYPES = [
  {
    value: "ECO_BUSINESS",
    label: "Eco Business",
    desc: "Local eco-friendly shop, café, or service",
  },
  {
    value: "MOBILITY_PROVIDER",
    label: "Mobility Provider",
    desc: "Shared bikes, e-scooters, or transit services",
  },
];

interface FormData {
  name: string;
  category: string;
  partnerType: string;
  websiteUrl: string;
  address: string;
  lat: number | null;
  lng: number | null;
  description: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

const INITIAL: FormData = {
  name: "",
  category: "",
  partnerType: "ECO_BUSINESS",
  websiteUrl: "",
  address: "",
  lat: null,
  lng: null,
  description: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
};

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}{" "}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function App() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [data, setData] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const set =
    (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setData((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    };

  const validate = (stepNum: number): Partial<FormData> => {
    const errs: Partial<FormData> = {};
    if (stepNum === 1) {
      if (!data.name.trim() || data.name.trim().length < 2)
        errs.name = "Business name must be at least 2 characters";
      if (!data.category) errs.category = "Please select a category";
      if (data.websiteUrl && !/^https?:\/\/.+\..+/.test(data.websiteUrl))
        errs.websiteUrl = "Please enter a valid URL (e.g. https://yourbusiness.com)";
    }
    if (stepNum === 2) {
      if (data.lat === null || data.lng === null)
        errs.address = "Please drop a pin on the map to set your location";
      if (!data.address.trim() || data.address.trim().length < 5)
        errs.address = "Please pin your location on the map — address could not be detected";
      if (!data.description.trim() || data.description.trim().length < 20)
        errs.description = "Description must be at least 20 characters";
    }
    if (stepNum === 3) {
      if (!data.contactName.trim() || data.contactName.trim().length < 2)
        errs.contactName = "Please enter your full name";
      if (!data.contactEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail))
        errs.contactEmail = "Please enter a valid email address";
    }
    return errs;
  };

  const handleNext = () => {
    const errs = validate(step);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    const errs = validate(step);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`${API_URL}/api/partners/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name.trim(),
          category: data.category,
          partnerType: data.partnerType,
          address: data.address.trim(),
          lat: data.lat,
          lng: data.lng,
          description: data.description.trim(),
          websiteUrl: data.websiteUrl.trim() || undefined,
          contactName: data.contactName.trim(),
          contactEmail: data.contactEmail.trim().toLowerCase(),
          contactPhone: data.contactPhone.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: { message?: string } };
        throw new Error(body?.error?.message ?? "Submission failed. Please try again.");
      }
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return <SuccessScreen />;

  const input = (hasError: boolean) =>
    `w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
      hasError
        ? "border-red-400 focus:ring-red-400/30 focus:border-red-400"
        : "border-gray-200 focus:ring-brand/30 focus:border-brand"
    }`;

  return (
    <div className="min-h-screen bg-brand-pale flex flex-col">
      {/* ── Header ── */}
      <header className="bg-brand text-white py-5 px-4 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-lg leading-tight">EcoRoute</p>
            <p className="text-white/75 text-xs">Partner Application Portal</p>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 px-4 py-8">
        <div className="max-w-lg mx-auto">

          {/* Intro */}
          <div className="text-center mb-7">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Become an EcoRoute Partner</h1>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              Join our network of eco-friendly businesses and reach thousands of green commuters every day.
            </p>
          </div>

          {/* Step indicator */}
          <StepIndicator current={step} steps={["Business Details", "Location & About", "Contact Info"]} />

          {/* Form card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">

            {/* ─── Step 1: Business Details ─── */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-base font-semibold text-gray-900">Tell us about your business</h2>

                <Field label="Business Name" required error={errors.name}>
                  <input
                    type="text"
                    placeholder="e.g. Green Wheels Café"
                    value={data.name}
                    onChange={set("name")}
                    className={input(!!errors.name)}
                    maxLength={100}
                  />
                </Field>

                <Field label="Category" required error={errors.category}>
                  <select
                    value={data.category}
                    onChange={set("category")}
                    className={input(!!errors.category)}
                  >
                    <option value="">Select a category…</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Partner Type" required>
                  <div className="space-y-2">
                    {PARTNER_TYPES.map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-start gap-3 p-3.5 border rounded-lg cursor-pointer transition-colors ${
                          data.partnerType === opt.value
                            ? "border-brand bg-brand-light"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="partnerType"
                          value={opt.value}
                          checked={data.partnerType === opt.value}
                          onChange={set("partnerType")}
                          className="mt-0.5 accent-brand"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </Field>

                <Field label="Website URL" error={errors.websiteUrl} hint="Optional — helps us verify your business">
                  <input
                    type="url"
                    placeholder="https://yourbusiness.com"
                    value={data.websiteUrl}
                    onChange={set("websiteUrl")}
                    className={input(!!errors.websiteUrl)}
                  />
                </Field>
              </div>
            )}

            {/* ─── Step 2: Location & About ─── */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-base font-semibold text-gray-900">Location & description</h2>

                <Field
                  label="Pin your location"
                  required
                  error={errors.address}
                  hint={data.lat === null ? "Click on the map to drop a pin on your business location" : undefined}
                >
                  <MapPicker
                    onLocationChange={(lat, lng, address) => {
                      setData((prev) => ({ ...prev, lat, lng, address }));
                      if (errors.address) setErrors((prev) => ({ ...prev, address: "" }));
                    }}
                  />
                  {data.lat !== null && (
                    <div className="mt-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 flex items-start gap-2">
                      <svg className="w-4 h-4 text-brand mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span>{data.address || `${data.lat?.toFixed(5)}, ${data.lng?.toFixed(5)}`}</span>
                    </div>
                  )}
                </Field>

                <Field label="Business Description" required error={errors.description}>
                  <textarea
                    rows={5}
                    placeholder="Describe your business and how it supports eco-friendly commuting…"
                    value={data.description}
                    onChange={set("description")}
                    className={`${input(!!errors.description)} resize-none`}
                    maxLength={2000}
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    {data.description.length} / 2000 {data.description.length < 20 && "(min. 20)"}
                  </p>
                </Field>
              </div>
            )}

            {/* ─── Step 3: Contact Info ─── */}
            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-base font-semibold text-gray-900">Who should we contact?</h2>

                <Field label="Contact Person" required error={errors.contactName}>
                  <input
                    type="text"
                    placeholder="Full name"
                    value={data.contactName}
                    onChange={set("contactName")}
                    className={input(!!errors.contactName)}
                    maxLength={100}
                  />
                </Field>

                <Field label="Email Address" required error={errors.contactEmail}>
                  <input
                    type="email"
                    placeholder="you@yourbusiness.com"
                    value={data.contactEmail}
                    onChange={set("contactEmail")}
                    className={input(!!errors.contactEmail)}
                  />
                </Field>

                <Field label="Phone Number" error={errors.contactPhone} hint="Optional">
                  <input
                    type="tel"
                    placeholder="+31 6 00 000 000"
                    value={data.contactPhone}
                    onChange={set("contactPhone")}
                    className={input(!!errors.contactPhone)}
                    maxLength={30}
                  />
                </Field>

                <div className="bg-brand-light border border-brand/20 rounded-xl p-4 text-sm text-gray-600">
                  <p className="font-semibold text-brand mb-1">What happens next?</p>
                  <p>Our team will review your application within 2–3 business days and contact you at the email you provided above.</p>
                </div>
              </div>
            )}
          </div>

          {/* Submit error */}
          {submitError && (
            <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {submitError}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-5 flex gap-3">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex-1 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="flex-1 py-3 bg-brand text-white font-medium rounded-xl hover:bg-brand-dark transition-colors text-sm"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 bg-brand text-white font-medium rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting…
                  </>
                ) : (
                  "Submit Application"
                )}
              </button>
            )}
          </div>

          {/* Footer */}
          <p className="mt-8 pb-6 text-center text-xs text-gray-400">
            By submitting, you agree to EcoRoute's{" "}
            <span className="text-brand">partner terms</span>.
            {" "}Questions?{" "}
            <a href="mailto:partners@ecoroute.app" className="text-brand hover:underline">
              Contact us
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
