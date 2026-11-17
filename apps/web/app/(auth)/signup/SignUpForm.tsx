"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form/Form";
import { FormTextInput } from "@/components/ui/form/FormTextInput";
import { Button } from "@/components/ui/shadcn/button";
import { Spinner } from "@/components/ui/shadcn/spinner";
import { AuthRequestError, postAuth } from "@/lib/auth/client";
import { showErrorToast } from "@/lib/toasts";
import { signUpSchema, type SignUpValues } from "@/lib/types/auth";

const SignUpForm = () => {
  const form = useForm<SignUpValues>({
    defaultValues: { email: "", password: "", confirmPassword: "" },
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (values: SignUpValues) => {
    try {
      await postAuth("/api/auth/signup", values);
      // Full navigation so every Server Component renders with the new session
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/");
    } catch (error) {
      const message =
        error instanceof AuthRequestError ? error.message : "Sign up failed";
      showErrorToast(message);
      if (error instanceof AuthRequestError && error.status === 409) {
        form.setError("email", { message: "This email is already registered" });
        form.setFocus("email");
      }
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
        noValidate
      >
        <FormTextInput
          control={form.control}
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
        />
        <FormTextInput
          control={form.control}
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
        />
        <FormTextInput
          control={form.control}
          name="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
        />
        <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Spinner />}
          Create account
        </Button>
      </form>
    </Form>
  );
};

export default SignUpForm;
