"use client";

import { PencilIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import Button from "@/components/Button";
import Card from "@/components/Card";
import DeleteTextModal from "@/components/DeleteTextModal";
import { Badge } from "@/components/ui/badge";
import { FormControl } from "@/components/ui/form-control";
import { Input } from "@/components/ui/input";
import { Join } from "@/components/ui/join";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { type Text, TextType } from "@/types/database";
import { getTexts } from "./actions";

interface TextListPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    sort?: string;
    order?: "asc" | "desc";
  }>;
}

function TextTable({
  texts,
  onDeleteClick,
}: {
  texts: Text[];
  onDeleteClick: (text: Text) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <THead>
          <TR>
            <TH>Título</TH>
            <TH>Tipo</TH>
            <TH>Palavras</TH>
            <TH>Idioma</TH>
            <TH>Criado em</TH>
            <TH>Ações</TH>
          </TR>
        </THead>
        <TBody>
          {texts.map((text) => (
            <TR key={text.id}>
              <TD>
                <div className="font-medium">{text.title}</div>
              </TD>
              <TD>
                <Badge
                  variant={
                    text.type === TextType.DIAGNOSTIC ? "default" : "neutral"
                  }
                >
                  {text.type === TextType.DIAGNOSTIC
                    ? "Diagnóstico"
                    : "Treinamento"}
                </Badge>
              </TD>
              <TD>{text.num_words}</TD>
              <TD>{text.language}</TD>
              <TD>{new Date(text.created_at).toLocaleDateString("pt-BR")}</TD>
              <TD>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/texts/edit/${text.id}`} title="Editar">
                      <PencilIcon className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    title="Deletar"
                    className="hover:bg-error"
                    onClick={() => onDeleteClick(text)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  searchParams,
}: {
  currentPage: number;
  totalPages: number;
  searchParams: {
    page?: string;
    search?: string;
    sort?: string;
    order?: "asc" | "desc";
  };
}) {
  const createPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (searchParams.search) params.set("search", searchParams.search);
    if (searchParams.sort) params.set("sort", searchParams.sort);
    if (searchParams.order) params.set("order", searchParams.order);
    params.set("page", page.toString());
    return `/admin/texts?${params.toString()}`;
  };

  return (
    <div className="flex justify-center">
      <Join>
        {currentPage > 1 && (
          <Button asChild variant="outline" size="sm">
            <Link href={createPageUrl(currentPage - 1)}>«</Link>
          </Button>
        )}

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Button
            key={page}
            asChild
            variant={page === currentPage ? "primary" : "outline"}
            size="sm"
          >
            <Link href={createPageUrl(page)}>{page}</Link>
          </Button>
        ))}

        {currentPage < totalPages && (
          <Button asChild variant="outline" size="sm">
            <Link href={createPageUrl(currentPage + 1)}>»</Link>
          </Button>
        )}
      </Join>
    </div>
  );
}

export default function TextListPage({ searchParams }: TextListPageProps) {
  const [texts, setTexts] = useState<Text[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    text: Text | null;
  }>({ isOpen: false, text: null });

  const resolvedSearchParams = use(searchParams) as {
    page?: string;
    search?: string;
    sort?: string;
    order?: "asc" | "desc";
  };
  const page = parseInt(resolvedSearchParams.page || "1", 10);
  const search = resolvedSearchParams.search || "";
  const sort = resolvedSearchParams.sort || "created_at";
  const order = resolvedSearchParams.order || "desc";

  useEffect(() => {
    const fetchTexts = async () => {
      setIsLoading(true);
      try {
        const result = await getTexts({
          page,
          search,
          sort,
          order,
        });
        setTexts(result.texts);
        setTotalCount(result.totalCount);
        setTotalPages(result.totalPages);
        setCurrentPage(result.currentPage);
      } catch {
      } finally {
        setIsLoading(false);
      }
    };

    fetchTexts();
  }, [page, search, sort, order]);

  const handleDeleteClick = (text: Text) => {
    setDeleteModal({ isOpen: true, text });
  };

  const handleDeleteSuccess = () => {
    // Refresh the list
    const fetchTexts = async () => {
      try {
        const result = await getTexts({
          page,
          search,
          sort,
          order,
        });
        setTexts(result.texts);
        setTotalCount(result.totalCount);
        setTotalPages(result.totalPages);
        setCurrentPage(result.currentPage);
      } catch {}
    };
    fetchTexts();
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-black">Gerenciar Textos</h1>
        <Link href="/admin/texts/create" className="focus-brutal">
          <Button variant="primary" size="sm">
            <PlusIcon className="h-5 w-5 mr-2" />
            Novo Texto
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <Card shadow="lg" padding="md" className="mb-6">
        <form method="GET" className="flex gap-4">
          <FormControl className="flex-1">
            <Input
              type="text"
              name="search"
              placeholder="Buscar por título..."
              defaultValue={search}
            />
          </FormControl>
          <FormControl>
            <Select name="sort" defaultValue={sort}>
              <option value="created_at">Data de Criação</option>
              <option value="title">Título</option>
              <option value="num_words">Número de Palavras</option>
              <option value={TextType.DIAGNOSTIC}>Diagnóstico</option>
              <option value={TextType.TRAINING}>Treinamento</option>
            </Select>
          </FormControl>
          <FormControl>
            <Select name="order" defaultValue={order}>
              <option value="desc">Decrescente</option>
              <option value="asc">Crescente</option>
            </Select>
          </FormControl>
          <Button type="submit" variant="outline">
            Filtrar
          </Button>
        </form>
      </Card>

      {/* Results */}
      <Card shadow="lg" padding="md">
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600">
            {totalCount} texto{totalCount !== 1 ? "s" : ""} encontrado
            {totalCount !== 1 ? "s" : ""}
          </p>
        </div>

        <TextTable texts={texts} onDeleteClick={handleDeleteClick} />

        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              searchParams={resolvedSearchParams}
            />
          </div>
        )}
      </Card>

      {/* Delete Modal */}
      {deleteModal.text && (
        <DeleteTextModal
          textId={deleteModal.text.id}
          textTitle={deleteModal.text.title}
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, text: null })}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}
