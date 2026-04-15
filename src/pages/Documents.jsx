import { useState } from 'react';
import { FileText, Plus, Search, MoreVertical } from 'lucide-react';

function Documents() {
  const [searchQuery, setSearchQuery] = useState('');

  const documents = [
    { id: 1, title: 'Project Proposal', type: 'PDF', size: '2.4 MB', date: '2024-01-15' },
    { id: 2, title: 'Meeting Notes', type: 'DOCX', size: '156 KB', date: '2024-01-14' },
    { id: 3, title: 'Budget Report', type: 'XLSX', size: '845 KB', date: '2024-01-13' },
    { id: 4, title: 'Design Mockups', type: 'FIG', size: '12.1 MB', date: '2024-01-12' },
  ];

  const getFileIcon = (type) => {
    const colors = {
      PDF: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
      DOCX: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      XLSX: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
      FIG: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documents</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your files</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-5 h-5" />
          <span className="font-medium">New Document</span>
        </button>
      </header>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
        />
      </div>

      {/* Document List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {documents.map((doc, index) => (
          <div 
            key={doc.id}
            className={`flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
              index !== documents.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getFileIcon(doc.type)}`}>
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 dark:text-white truncate">{doc.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{doc.type} • {doc.size}</p>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">{doc.date}</span>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Documents;
