import Link from "next/link";
import Button from "@/components/Button";
import Card from "@/components/Card";

export default function ErrorPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <Card className="w-full max-w-md text-center" padding="lg">
        <h1 className="text-3xl font-bold text-black">Algo deu errado</h1>
        <p className="text-gray-600 mt-2">
          Ocorreu um erro inesperado. Tente novamente ou volte para o login.
        </p>
        <div className="mt-8">
          <Button asChild variant="primary">
            <Link href="/login">Voltar para o login</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
