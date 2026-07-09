"use client";

import Link from "next/link";
import { getTexts } from "./actions";
import { Suspense, useState, useEffect, use } from "react";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import DeleteTextModal from "@/components/DeleteTextModal";
import { Text, TextType } from "@/types/database";
import Button from "@/components/Button";

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
      <table className="table w-full">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-black font-semibold">Título</th>
            <th className="text-black font-semibold">Tipo</th>
            <th className="text-black font-semibold">Palavras</th>
            <th className="text-black font-semibold">Idioma</th>
            <th className="text-black font-semibold">Criado em</th>
            <th className="text-black font-semibold">Ações</th>
          </tr>
        </thead>
        <tbody>
          {texts.map((text) => (
            <tr key={text.id} className="hover:bg-gray-50">
              <td className="text-black">
                <div className="font-medium">{text.title}</div>
              </td>
              <td className="text-black">
                <span
                  className={`badge ${
                    text.type === TextType.DIAGNOSTIC
                      ? "bg-primary-800 text-white"
                      : "bg-primary-200 text-primary-800"
                  }`}
                >
                  {text.type === TextType.DIAGNOSTIC
                    ? "Diagnóstico"
                    : "Treinamento"}
                </span>
              </td>
              <td className="text-black">{text.num_words}</td>
              <td className="text-black">{text.language}</td>
              <td className="text-black">
                {new Date(text.created_at).toLocaleDateString("pt-BR")}
              </td>
              <td className="text-black">
                <div className="flex gap-2">
                  <Link
                    href={`/admin/texts/edit/${text.id}`}
                    className="btn btn-sm btn-ghost text-black hover:bg-gray-200"
                    title="Editar"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Link>
                  <button
                    className="btn btn-sm btn-ghost text-error hover:bg-red-50"
                    title="Deletar"
                    onClick={() => onDeleteClick(text)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
      <div className="join">
        {currentPage > 1 && (
          <Link
            href={createPageUrl(currentPage - 1)}
            className="join-item btn btn-sm"
          >
            «
          </Link>
        )}

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Link
            key={page}
            href={createPageUrl(page)}
            className={`join-item btn btn-sm ${
              page === currentPage ? "btn-active" : ""
            }`}
          >
            {page}
          </Link>
        ))}

        {currentPage < totalPages && (
          <Link
            href={createPageUrl(currentPage + 1)}
            className="join-item btn btn-sm"
          >
            »
          </Link>
        )}
      </div>
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
  const page = parseInt(resolvedSearchParams.page || "1");
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
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-black">Gerenciar Textos</h1>
        <Link href="/admin/texts/create">
          <Button variant="primary" size="sm">
            <PlusIcon className="h-5 w-5 mr-2" />
            Novo Texto
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="card bg-white border border-gray-200 shadow-lg mb-6">
        <div className="card-body p-6">
          <form method="GET" className="flex gap-4">
            <div className="form-control flex-1">
              <input
                type="text"
                name="search"
                placeholder="Buscar por título..."
                defaultValue={search}
                className="input input-bordered w-full bg-white border-gray-300 text-black placeholder-gray-400 focus:border-black focus:ring-0"
              />
            </div>
            <div className="form-control">
              <select
                name="sort"
                defaultValue={sort}
                className="select select-bordered bg-white border-gray-300 text-black focus:border-black focus:ring-0"
              >
                <option value="created_at">Data de Criação</option>
                <option value="title">Título</option>
                <option value="num_words">Número de Palavras</option>
                <option value={TextType.DIAGNOSTIC}>Diagnóstico</option>
                <option value={TextType.TRAINING}>Treinamento</option>
              </select>
            </div>
            <div className="form-control">
              <select
                name="order"
                defaultValue={order}
                className="select select-bordered bg-white border-gray-300 text-black focus:border-black focus:ring-0"
              >
                <option value="desc">Decrescente</option>
                <option value="asc">Crescente</option>
              </select>
            </div>
            <button type="submit" className="btn btn-outline">
              Filtrar
            </button>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="card bg-white border border-gray-200 shadow-lg">
        <div className="card-body p-6">
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
        </div>
      </div>

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
