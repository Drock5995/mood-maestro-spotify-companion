"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the login page immediately
    router.replace('/login');
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-green-900 to-black text-white">
      <h1 className="text-4xl font-bold mb-4">Redirecting...</h1>
      <p className="text-lg">Please wait while we take you to the login page.</p>
    </main>
  );
}