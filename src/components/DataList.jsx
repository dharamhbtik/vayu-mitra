import { RefreshCw, AlertCircle, FileX } from 'lucide-react';

/**
 * DataList Component
 * Renders a list of data items with loading, error, and empty states
 * @param {Object} props
 * @param {Array} props.data - Array of items to render
 * @param {boolean} props.loading - Whether data is loading
 * @param {string|null} props.error - Error message to display
 * @param {Function} props.onRetry - Callback when retry button is clicked
 * @param {Function} props.renderItem - Custom render function for each item (item, index) => JSX
 * @param {Function} props.keyExtractor - Function to get unique key from item (default: item.id)
 * @param {string} props.emptyTitle - Title for empty state (default: "No Data")
 * @param {string} props.emptyDescription - Description for empty state
 */
function DataList({
  data = [],
  loading = false,
  error = null,
  onRetry,
  renderItem,
  keyExtractor = (item) => item.id,
  emptyTitle = 'No Data',
  emptyDescription = 'There are no items to display at the moment.',
}) {
  // Skeleton Card Component
  const SkeletonCard = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="flex gap-2 pt-1">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          </div>
        </div>
      </div>
    </div>
  );

  // Error State
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Something went wrong
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-sm mb-6">
          {error}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 active:scale-95 transition-all"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
        )}
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  // Empty State
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <FileX className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {emptyTitle}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-sm">
          {emptyDescription}
        </p>
      </div>
    );
  }

  // Default Item Renderer
  const defaultRenderItem = (item) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Icon/Avatar */}
        {item.image || item.icon ? (
          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {item.image ? (
              <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl">{item.icon}</span>
            )}
          </div>
        ) : (
          <div className={`w-12 h-12 rounded-xl flex-shrink-0 ${
            item.status === 'active' ? 'bg-green-100 dark:bg-green-900/20' : 
            item.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
            item.status === 'error' ? 'bg-red-100 dark:bg-red-900/20' :
            'bg-blue-100 dark:bg-blue-900/20'
          }`} />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
              {item.title || item.name || 'Untitled'}
            </h4>
            {item.status && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                item.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                item.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                item.status === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {item.status}
              </span>
            )}
          </div>
          
          {item.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {item.description}
            </p>
          )}
          
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
            {item.date && (
              <span>{new Date(item.date).toLocaleDateString()}</span>
            )}
            {item.category && (
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                {item.category}
              </span>
            )}
            {item.value !== undefined && (
              <span className="font-medium text-gray-900 dark:text-white">
                {item.value}
              </span>
            )}
          </div>
        </div>

        {/* Action */}
        {item.onClick && (
          <button
            onClick={() => item.onClick(item)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <span className="sr-only">View details</span>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );

  // Data List
  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={keyExtractor(item) || index}>
          {renderItem ? renderItem(item, index) : defaultRenderItem(item)}
        </div>
      ))}
    </div>
  );
}

export default DataList;
