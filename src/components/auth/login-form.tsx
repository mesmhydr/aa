"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@/components/ui";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callback = searchParams.get("callbackUrl") || "/";
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await authClient.signIn.email({ email, password });
    if (error) {
      setError(error.message || "Invalid credentials");
      setLoading(false);
      return;
    }
    router.push(callback);
    router.refresh();
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription>Access the college ERP platform</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@college.edu"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
