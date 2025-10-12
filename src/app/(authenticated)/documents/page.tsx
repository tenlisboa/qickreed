export default function DocumentsPage() {
  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black">Documents</h1>
        <p className="text-gray-600 mt-2">Manage your documents and files</p>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <input
            type="search"
            placeholder="Search documents..."
            className="input input-bordered w-80 bg-white border-gray-300 text-black placeholder-gray-400 focus:border-black focus:ring-0"
          />
          <button className="btn bg-white hover:bg-gray-100 text-black border border-gray-300 transition-colors">
            Filter
          </button>
        </div>
        <button className="btn bg-black hover:bg-gray-800 text-white border-none transition-colors">
          New Document
        </button>
      </div>

      {/* Documents List */}
      <div className="card bg-white border border-gray-200 shadow-lg">
        <div className="card-body p-0">
          {/* Table Header */}
          <div className="flex items-center px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex-1 text-sm font-medium text-black">Name</div>
            <div className="w-32 text-sm font-medium text-black">Type</div>
            <div className="w-32 text-sm font-medium text-black">Modified</div>
            <div className="w-20 text-sm font-medium text-black">Size</div>
            <div className="w-16"></div>
          </div>

          {/* Document Rows */}
          <div className="divide-y divide-gray-100">
            {[
              {
                name: "Project Proposal.pdf",
                type: "PDF",
                modified: "2 hours ago",
                size: "2.4 MB",
              },
              {
                name: "Meeting Notes.docx",
                type: "Word",
                modified: "1 day ago",
                size: "156 KB",
              },
              {
                name: "Budget Spreadsheet.xlsx",
                type: "Excel",
                modified: "3 days ago",
                size: "890 KB",
              },
              {
                name: "Design Mockups.fig",
                type: "Figma",
                modified: "1 week ago",
                size: "5.2 MB",
              },
              {
                name: "Technical Specs.md",
                type: "Markdown",
                modified: "2 weeks ago",
                size: "45 KB",
              },
            ].map((doc, index) => (
              <div
                key={index}
                className="flex items-center px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 flex items-center">
                  <span className="text-base mr-3">📄</span>
                  <span className="text-sm font-medium text-black">
                    {doc.name}
                  </span>
                </div>
                <div className="w-32 text-sm text-gray-600">{doc.type}</div>
                <div className="w-32 text-sm text-gray-600">{doc.modified}</div>
                <div className="w-20 text-sm text-gray-600">{doc.size}</div>
                <div className="w-16">
                  <button className="text-gray-400 hover:text-black transition-colors">
                    ⋯
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <p className="text-sm text-gray-600">Showing 1 to 5 of 247 documents</p>
        <div className="flex items-center space-x-2">
          <button className="btn btn-sm bg-white hover:bg-gray-100 text-black border border-gray-300 transition-colors">
            Previous
          </button>
          <button className="btn btn-sm bg-black text-white">1</button>
          <button className="btn btn-sm bg-white hover:bg-gray-100 text-black border border-gray-300 transition-colors">
            2
          </button>
          <button className="btn btn-sm bg-white hover:bg-gray-100 text-black border border-gray-300 transition-colors">
            3
          </button>
          <button className="btn btn-sm bg-white hover:bg-gray-100 text-black border border-gray-300 transition-colors">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
