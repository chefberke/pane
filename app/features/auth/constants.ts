import type { AuthMode } from './types';

/** OAuth client names — must match the names configured in the InstantDB dashboard. */
export const OAUTH_CLIENT_NAMES = {
  google: 'google',
  github: 'github',
} as const;

/** Fallback redirect target after auth when no `next` query param is provided. */
export const DEFAULT_NEXT_PATH = '/w';

/** Path of the OAuth redirect callback. */
export const OAUTH_CALLBACK_PATH = '/auth/callback';

/** Copy for the sign-in and sign-up pages. */
export const COPY: Record<AuthMode, {
  title: string;
  subtitle: string;
  submitEmail: string;
  submitCode: string;
  altPrompt: string;
  altLinkLabel: string;
  altLinkHref: string;
}> = {
  'sign-in': {
    title: 'Welcome back',
    subtitle: 'Sign in with your email or a provider to continue.',
    submitEmail: 'Send code',
    submitCode: 'Sign in',
    altPrompt: "Don't have an account?",
    altLinkLabel: 'Sign up',
    altLinkHref: '/sign-up',
  },
  'sign-up': {
    title: 'Create your account',
    subtitle: 'Sign up with your email or a provider — no password needed.',
    submitEmail: 'Send code',
    submitCode: 'Create account',
    altPrompt: 'Already have an account?',
    altLinkLabel: 'Sign in',
    altLinkHref: '/sign-in',
  },
};
