import Link from "next/link";

export default function Home() {
  return (
    <>
      <h1>Welcome to the Home Page!</h1>

      <Link href="/dashboard" className="focus-brutal">
        Go to Dashboard
      </Link>
    </>
  );
}
