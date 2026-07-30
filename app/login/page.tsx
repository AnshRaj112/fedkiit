"use client";

import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center pt-24 pb-16 px-4 relative overflow-hidden">
      {/* Background ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle, #f97316 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-[#f97316]/10 rounded-xl mb-4">
            <Image
              src="/fedkiit-mascot.png"
              alt="FED KIIT Logo"
              width={40}
              height={40}
              className="rounded-md object-cover"
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-[#888] text-sm">
            Sign in to access your FED KIIT portal
          </p>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#aaa] uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              placeholder="founder@kiit.ac.in"
              className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#555] text-sm focus:outline-none focus:border-[#f97316] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#aaa] uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#555] text-sm focus:outline-none focus:border-[#f97316] transition-colors"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-[#888] pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-[#f97316] rounded" />
              Remember me
            </label>
            <a href="#" className="hover:text-[#f97316] transition-colors">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="fed-btn-primary w-full justify-center py-3 text-base mt-2"
          >
            Sign In →
          </button>
        </form>

        <p className="text-center text-xs text-[#666] mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/contact" className="text-[#f97316] hover:underline font-medium">
            Apply to FED
          </Link>
        </p>
      </div>
    </div>
  );
}
