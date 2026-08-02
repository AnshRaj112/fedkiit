"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminAliasPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/profile/social");
  }, [router]);

  return null;
}
