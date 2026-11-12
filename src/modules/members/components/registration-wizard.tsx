"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, FileUp, Loader2, MailCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Field, FormError } from "@/components/form/field";
import { createClient } from "@/lib/supabase/client";
import { formatBytes, rulesFor, validateFileMeta, type UploadKind } from "@/lib/uploads";
import { cn } from "@/lib/utils";
import { prepareUploadsAction, submitApplicationAction } from "../registration-actions";
import { applicationSchema, STEP_FIELDS, type ApplicationInput } from "../schemas";

type Option = { id: string; name: string };
type TierOption = Option & { feeLabel: string; description: string | null };

const STEPS = ["Company", "Managing Director", "Your details", "Membership", "Documents"] as const;

type Files = Partial<Record<UploadKind, File>>;

export function RegistrationWizard({ tiers, sectors }: { tiers: TierOption[]; sectors: Option[] }) {
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<Files>({});
  const [fileErrors, setFileErrors] = useState<Partial<Record<UploadKind, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [done, setDone] = useState<{ email: string; demoToken: string | null } | null>(null);
  const [pending, startTransition] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const form = useForm<ApplicationInput>({
    resolver: zodResolver(applicationSchema),
    mode: "onTouched",
    defaultValues: {
      companyName: "", rcNumber: "", sectorId: "", website: "", address: "",
      mdName: "", mdEmail: "", mdPhone: "",
      repName: "", repEmail: "", repPhone: "", password: "", confirmPassword: "",
      tierId: "", reasonForJoining: "", acceptTerms: false,
    },
  });
  const { register, formState: { errors } } = form;
  const err = (name: FieldPath<ApplicationInput>) => errors[name]?.message as string | undefined;

  useEffect(() => {
    headingRef.current?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step, done]);

  async function next() {
    setError(null);
    const ok = await form.trigger(STEP_FIELDS[step]);
    if (!ok) return;
    if (step === 2 && form.getValues("password") !== form.getValues("confirmPassword")) {
      form.setError("confirmPassword", { message: "Passwords do not match" });
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function pickFile(kind: UploadKind, file: File | undefined) {
    setFileErrors((e) => ({ ...e, [kind]: undefined }));
    if (!file) return setFiles((f) => ({ ...f, [kind]: undefined }));
    const problem = validateFileMeta(kind, file);
    if (problem) {
      setFileErrors((e) => ({ ...e, [kind]: problem }));
      return setFiles((f) => ({ ...f, [kind]: undefined }));
    }
    setFiles((f) => ({ ...f, [kind]: file }));
  }

  const onSubmit = form.handleSubmit(
    (values) => {
      setError(null);
      if (!files.CAC_CERTIFICATE) {
        setFileErrors((e) => ({ ...e, CAC_CERTIFICATE: "Your CAC certificate is required." }));
        return;
      }
      startTransition(async () => {
        try {
          const chosen = (Object.entries(files) as [UploadKind, File | undefined][]).filter(
            (e): e is [UploadKind, File] => !!e[1],
          );
          setProgress("Preparing upload…");
          const prep = await prepareUploadsAction({
            files: chosen.map(([kind, f]) => ({ kind, name: f.name, type: f.type, size: f.size })),
          });
          if (!prep.ok) return setError(prep.error);

          const supabase = createClient();
          for (const [i, u] of prep.data.uploads.entries()) {
            const file = files[u.kind]!;
            setProgress(`Uploading ${i + 1} of ${prep.data.uploads.length}: ${file.name}`);
            const { error: upErr } = await supabase.storage
              .from(u.bucket)
              .uploadToSignedUrl(u.path, u.token, file, { contentType: file.type });
            if (upErr) return setError(`Upload failed for ${file.name}. Please try again.`);
          }

          setProgress("Submitting your application…");
          const res = await submitApplicationAction({
            application: values,
            draftId: prep.data.draftId,
            uploads: prep.data.uploads.map((u) => ({ kind: u.kind, path: u.path, fileName: files[u.kind]!.name })),
          });
          if (!res.ok) {
            setError(res.error);
            if (res.code === "email_taken") setStep(2);
            return;
          }
          setDone(res.data);
        } catch {
          setError("Something went wrong. Please check your connection and try again.");
        } finally {
          setProgress(null);
        }
      });
    },
    () => setError("Some details are missing or invalid. Please review the earlier steps."),
  );

  if (done) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-center md:p-10" role="status">
        <MailCheck className="mx-auto size-12 text-brand-gold" aria-hidden />
        <h2 ref={headingRef} tabIndex={-1} className="mt-4 text-2xl font-bold text-primary outline-none">
          Check your email
        </h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          We have sent a confirmation link to <strong className="text-foreground">{done.email}</strong>. Confirm your
          email to send your application for review.
        </p>
        {done.demoToken && (
          <div className="mx-auto mt-6 max-w-md rounded-xl border border-dashed border-brand-gold bg-accent/60 p-4">
            <p className="text-sm text-accent-foreground">Demo mode: skip the inbox step.</p>
            <Button asChild className="mt-3 w-full">
              <a href={`/auth/confirm?token_hash=${encodeURIComponent(done.demoToken)}&type=email&next=/member`}>
                Verify now (demo)
              </a>
            </Button>
          </div>
        )}
        <Button asChild variant="outline" className="mt-6">
          <Link href="/login">Go to sign in</Link>
        </Button>
      </div>
    );
  }

  const tierId = form.watch("tierId");
  const values = form.watch();

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <Stepper step={step} />

      <section className="rounded-2xl border bg-card p-5 md:p-8" aria-labelledby="step-heading">
        <h2 id="step-heading" ref={headingRef} tabIndex={-1} className="text-xl font-bold text-primary outline-none">
          {STEPS[step]}
        </h2>
        <div className="mt-5 grid gap-4">
          <FormError message={error} />

          {step === 0 && (
            <>
              <Field id="companyName" label="Company name" error={err("companyName")} required>
                <Input autoComplete="organization" {...register("companyName")} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="rcNumber" label="RC number" hint="As shown on your CAC certificate" error={err("rcNumber")} required>
                  <Input autoComplete="off" {...register("rcNumber")} />
                </Field>
                <Field id="sectorId" label="Sector" error={err("sectorId")} required>
                  <NativeSelect {...register("sectorId")}>
                    <option value="">Choose a sector</option>
                    {sectors.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </NativeSelect>
                </Field>
              </div>
              <Field id="website" label="Website" hint="Optional" error={err("website")}>
                <Input type="url" inputMode="url" autoComplete="url" placeholder="www.example.com" {...register("website")} />
              </Field>
              <Field id="address" label="Registered address" error={err("address")} required>
                <Textarea autoComplete="street-address" rows={3} {...register("address")} />
              </Field>
              <FilePicker kind="LOGO" label="Company logo" optional file={files.LOGO} error={fileErrors.LOGO} onPick={pickFile} />
            </>
          )}

          {step === 1 && (
            <>
              <Field id="mdName" label="Full name" error={err("mdName")} required>
                <Input autoComplete="off" {...register("mdName")} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="mdEmail" label="Email" error={err("mdEmail")} required>
                  <Input type="email" inputMode="email" autoComplete="off" {...register("mdEmail")} />
                </Field>
                <Field id="mdPhone" label="Phone" error={err("mdPhone")} required>
                  <Input type="tel" inputMode="tel" autoComplete="off" placeholder="+234 803 123 4567" {...register("mdPhone")} />
                </Field>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm text-muted-foreground">
                You will be the company&apos;s representative and use these details to sign in.
              </p>
              <Field id="repName" label="Full name" error={err("repName")} required>
                <Input autoComplete="name" {...register("repName")} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="repEmail" label="Email" error={err("repEmail")} required>
                  <Input type="email" inputMode="email" autoComplete="email" {...register("repEmail")} />
                </Field>
                <Field id="repPhone" label="Phone" error={err("repPhone")} required>
                  <Input type="tel" inputMode="tel" autoComplete="tel" placeholder="+234 803 123 4567" {...register("repPhone")} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="password" label="Password" hint="At least 10 characters, with letters and numbers." error={err("password")} required>
                  <Input type="password" autoComplete="new-password" {...register("password")} />
                </Field>
                <Field id="confirmPassword" label="Confirm password" error={err("confirmPassword")} required>
                  <Input type="password" autoComplete="new-password" {...register("confirmPassword")} />
                </Field>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <fieldset className="grid gap-3">
                <legend className="mb-2 text-sm font-medium">
                  Membership tier <span className="text-destructive" aria-hidden>*</span>
                </legend>
                {tiers.map((t) => (
                  <label
                    key={t.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                      tierId === t.id ? "border-primary bg-secondary" : "hover:bg-muted",
                    )}
                  >
                    <input type="radio" value={t.id} {...register("tierId")} className="mt-1 size-5 accent-[var(--brand-navy)]" />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <span className="font-semibold">{t.name}</span>
                        <span className="font-semibold text-primary">{t.feeLabel}<span className="text-xs font-normal text-muted-foreground"> / year</span></span>
                      </span>
                      {t.description && <span className="mt-0.5 block text-sm text-muted-foreground">{t.description}</span>}
                    </span>
                  </label>
                ))}
                {err("tierId") && <p className="text-sm text-destructive" role="alert">{err("tierId")}</p>}
              </fieldset>
              <Field id="reasonForJoining" label="Why do you want to join the Chamber?" error={err("reasonForJoining")} required>
                <Textarea rows={4} {...register("reasonForJoining")} />
              </Field>
            </>
          )}

          {step === 4 && (
            <>
              <FilePicker kind="CAC_CERTIFICATE" label="CAC certificate" file={files.CAC_CERTIFICATE} error={fileErrors.CAC_CERTIFICATE} onPick={pickFile} />
              <FilePicker kind="COMPANY_PROFILE" label="Company profile" optional file={files.COMPANY_PROFILE} error={fileErrors.COMPANY_PROFILE} onPick={pickFile} />

              <div className="rounded-xl bg-muted p-4">
                <h3 className="font-semibold">Review</h3>
                <dl className="mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[10rem_1fr]">
                  <Review label="Company" value={values.companyName} />
                  <Review label="RC number" value={values.rcNumber} />
                  <Review label="Sector" value={sectors.find((s) => s.id === values.sectorId)?.name} />
                  <Review label="Managing Director" value={values.mdName} />
                  <Review label="Representative" value={`${values.repName} · ${values.repEmail}`} />
                  <Review label="Tier" value={tiers.find((t) => t.id === values.tierId)?.name} />
                </dl>
                <button type="button" onClick={() => setStep(0)} className="mt-2 min-h-11 text-sm font-medium text-primary underline underline-offset-4">
                  Edit details
                </button>
              </div>

              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" {...register("acceptTerms")} className="mt-0.5 size-5 accent-[var(--brand-navy)]" />
                <span>I confirm the information provided is accurate and I am authorised to apply on behalf of this company.</span>
              </label>
              {err("acceptTerms") && <p className="text-sm text-destructive" role="alert">{err("acceptTerms")}</p>}
            </>
          )}
        </div>
      </section>

      {progress && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status" aria-live="polite">
          <Loader2 className="size-4 animate-spin" aria-hidden /> {progress}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {step > 0 ? (
          <Button type="button" variant="outline" size="lg" onClick={() => setStep((s) => s - 1)} disabled={pending}>
            <ArrowLeft aria-hidden /> Back
          </Button>
        ) : (
          <span />
        )}
        {step < STEPS.length - 1 ? (
          <Button type="button" size="lg" onClick={next}>
            Continue <ArrowRight aria-hidden />
          </Button>
        ) : (
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
            Submit application
          </Button>
        )}
      </div>
    </form>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-muted-foreground">
        Step {step + 1} of {STEPS.length}
      </p>
      <ol className="grid grid-cols-5 gap-1.5" aria-label="Application progress">
        {STEPS.map((label, i) => (
          <li key={label} className="min-w-0">
            <span
              className={cn("block h-1.5 rounded-full", i <= step ? "bg-primary" : "bg-border")}
              aria-hidden
            />
            <span className={cn("mt-1.5 hidden truncate text-xs md:block", i === step ? "font-semibold text-primary" : "text-muted-foreground")}>
              {label}
            </span>
            <span className="sr-only">
              {label}: {i < step ? "completed" : i === step ? "current step" : "not started"}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Review({ label, value }: { label: string; value?: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mb-1 font-medium break-words sm:mb-0">{value || "—"}</dd>
    </>
  );
}

function FilePicker({
  kind,
  label,
  optional,
  file,
  error,
  onPick,
}: {
  kind: UploadKind;
  label: string;
  optional?: boolean;
  file?: File;
  error?: string;
  onPick: (kind: UploadKind, file: File | undefined) => void;
}) {
  const rules = rulesFor(kind);
  const id = `file-${kind}`;
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="grid gap-1.5">
      <span className="text-sm font-medium" id={`${id}-label`}>
        {label}
        {optional ? <span className="font-normal text-muted-foreground"> (optional)</span> : <span className="text-destructive" aria-hidden> *</span>}
      </span>
      {file ? (
        <div className="flex items-center gap-3 rounded-xl border bg-muted/50 p-3">
          <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Remove ${label}`}
            onClick={() => {
              onPick(kind, undefined);
              if (inputRef.current) inputRef.current.value = "";
            }}
          >
            <X aria-hidden />
          </Button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className={cn(
            "flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed p-4 text-center transition-colors hover:bg-muted has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
            error && "border-destructive",
          )}
        >
          <FileUp className="size-6 text-muted-foreground" aria-hidden />
          <span className="text-sm font-medium text-primary">Choose file</span>
          <span className="text-xs text-muted-foreground">{rules.label}</span>
        </label>
      )}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={rules.mimeTypes.join(",")}
        className="sr-only"
        aria-labelledby={`${id}-label`}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onPick(kind, e.target.files?.[0])}
      />
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
    </div>
  );
}
