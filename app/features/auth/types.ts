/** Which auth surface the user is on: sign-in or sign-up (UX-only, flow is identical). */
export type AuthMode = 'sign-in' | 'sign-up';

/** Magic-code form step: collecting email, or collecting the code that was emailed. */
export type AuthStep = 'email' | 'code';
