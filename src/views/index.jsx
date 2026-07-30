"use client";

// Pages Index

// Main Pages
export {default as Home} from './Home/Home';
export {default as Event} from './Event/Event';
export {default as PastEvent} from './Event/PastEvent';
export {default as Social} from './Social/Social';
export {default as Team} from './Team/Team';
export {default as Alumni} from './Alumni/Alumni';
// Profile is intentionally not exported here: the page component was replaced
// by app/(main)/profile/layout.jsx, because React Router's <Outlet /> maps onto
// a Next.js layout's children rather than a nested component.

// Authentication Pages
export {default as Login} from './Authentication/Login/Login';
export {default as Signup} from './Authentication/Signup/Signup';
export {default as ForgotPassword} from './Authentication/ForgotPassword/ForgotPassword';

// Error Page
export {default as Error} from './Error/Error';

// Other Pages
export {default as PrivacyPolicy} from './PrivacyPolicy/PrivacyPolicy';
export {default as TermsAndConditions} from './TermsAndConditions/T&C';
