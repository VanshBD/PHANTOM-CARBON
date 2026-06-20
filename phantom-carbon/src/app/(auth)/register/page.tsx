'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { z } from 'zod';

const registerFormSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerFormSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerFormSchema),
  });

  async function onSubmit(data: RegisterForm) {
    setIsLoading(true);
    setServerError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setServerError('An account with this email already exists. Try signing in instead.');
        } else {
          setServerError(json.error ?? 'Registration failed. Please try again.');
        }
        return;
      }

      // Auto sign-in after registration
      await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      router.push('/dashboard');
    } catch {
      setServerError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-white hover:text-green-400 transition-colors">
            <span className="text-3xl" aria-hidden="true">👻</span>
            <span className="text-xl font-bold">Phantom Carbon</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-6 mb-2">Create your account</h1>
          <p className="text-gray-500">Start tracking what others miss</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          {serverError && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-6 p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-red-400 text-sm flex items-start gap-2"
            >
              <span aria-hidden="true">⚠️</span>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Create account form">
            {/* Name */}
            <div className="mb-5">
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Full name <span className="text-red-400" aria-label="required">*</span>
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                aria-required="true"
                aria-describedby={errors.name ? 'name-error' : undefined}
                aria-invalid={!!errors.name}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus-visible:ring-2 focus-visible:ring-green-500 focus:border-green-500 outline-none transition-colors"
                placeholder="Ada Lovelace"
                {...register('name')}
              />
              {errors.name && (
                <p id="name-error" className="mt-1.5 text-sm text-red-400" role="alert">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="mb-5">
              <label htmlFor="reg-email" className="block text-sm font-medium text-gray-300 mb-2">
                Email address <span className="text-red-400" aria-label="required">*</span>
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                aria-required="true"
                aria-describedby={errors.email ? 'reg-email-error' : undefined}
                aria-invalid={!!errors.email}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus-visible:ring-2 focus-visible:ring-green-500 focus:border-green-500 outline-none transition-colors"
                placeholder="you@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p id="reg-email-error" className="mt-1.5 text-sm text-red-400" role="alert">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="mb-5">
              <label htmlFor="reg-password" className="block text-sm font-medium text-gray-300 mb-2">
                Password <span className="text-red-400" aria-label="required">*</span>
              </label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                aria-required="true"
                aria-describedby="password-requirements reg-password-error"
                aria-invalid={!!errors.password}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus-visible:ring-2 focus-visible:ring-green-500 focus:border-green-500 outline-none transition-colors"
                placeholder="Min. 8 chars, 1 uppercase, 1 number"
                {...register('password')}
              />
              <p id="password-requirements" className="mt-1 text-xs text-gray-600">
                8+ characters, one uppercase letter, one number
              </p>
              {errors.password && (
                <p id="reg-password-error" className="mt-1 text-sm text-red-400" role="alert">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm password */}
            <div className="mb-6">
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm password <span className="text-red-400" aria-label="required">*</span>
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                aria-required="true"
                aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                aria-invalid={!!errors.confirmPassword}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus-visible:ring-2 focus-visible:ring-green-500 focus:border-green-500 outline-none transition-colors"
                placeholder="••••••••"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p id="confirm-password-error" className="mt-1.5 text-sm text-red-400" role="alert">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
              className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                  Creating account…
                </span>
              ) : (
                'Create account'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 mt-6 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-green-400 hover:text-green-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
