"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form/Form";
import { FormTextInput } from "@/components/ui/form/FormTextInput";
import { Button } from "@/components/ui/shadcn/button";
import { Spinner } from "@/components/ui/shadcn/spinner";
import { AuthRequestError, postAuth } from "@/lib/auth/client";
import { showErrorToast } from "@/lib/toasts";
import { loginSchema, type LoginValues } from "@/lib/types/auth";
import { safeRedirectPath } from "@/lib/utils/format";

const LoginForm = () => {
  const form = useForm<LoginValues>({
    defaultValues: { email: "", password: "" },
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginValues) => {
    try {
      await postAuth("/api/auth/login", values);
      const next = new URLSearchParams(window.location.search).get("next");
      // Full navigation so every Server Component renders with the new session
      window.location.assign(safeRedirectPath(next));
    } catch (error) {
      const message =
        error instanceof AuthRequestError ? error.message : "Login failed";
      showErrorToast(message);
      if (error instanceof AuthRequestError && error.status === 401) {
        form.setError("password", { message: "Invalid email or password" });
        form.setFocus("password");
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
          autoComplete="current-password"
        />
        <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Spinner />}
          Log in
        </Button>
      </form>
    </Form>
  );
};

export default LoginForm;
