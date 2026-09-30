import type { FieldError as RhfFieldError } from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

interface WrapperProps {
  id: string;
  label: string;
  error?: RhfFieldError;
  description?: React.ReactNode;
  className?: string;
}

function FieldWrapper({ id, label, error, description, className, children }: WrapperProps & { children: React.ReactNode }) {
  return (
    <Field data-invalid={Boolean(error)} className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {children}
      {description && !error && <FieldDescription>{description}</FieldDescription>}
      <FieldError errors={[error]} />
    </Field>
  );
}

export function TextField({ id, label, error, description, className, ...props }: WrapperProps & React.ComponentProps<"input">) {
  return (
    <FieldWrapper id={id} label={label} error={error} description={description} className={className}>
      <Input id={id} aria-invalid={Boolean(error)} {...props} />
    </FieldWrapper>
  );
}

export function TextAreaField({ id, label, error, description, className, ...props }: WrapperProps & React.ComponentProps<"textarea">) {
  return (
    <FieldWrapper id={id} label={label} error={error} description={description} className={className}>
      <Textarea id={id} aria-invalid={Boolean(error)} {...props} />
    </FieldWrapper>
  );
}

export function SelectField({ id, label, error, description, className, children, ...props }: WrapperProps & React.ComponentProps<"select">) {
  return (
    <FieldWrapper id={id} label={label} error={error} description={description} className={className}>
      <NativeSelect id={id} aria-invalid={Boolean(error)} {...props}>
        {children}
      </NativeSelect>
    </FieldWrapper>
  );
}
