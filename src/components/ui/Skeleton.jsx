export const ProductCardSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-gray-200 rounded-xl h-64 w-full"></div>
    <div className="mt-4 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-6 bg-gray-200 rounded w-1/4 mt-2"></div>
    </div>
  </div>
);

export const OrderSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-sm border p-5 animate-pulse">
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-32"></div>
        <div className="h-3 bg-gray-200 rounded w-24"></div>
        <div className="h-3 bg-gray-200 rounded w-40"></div>
      </div>
      <div className="h-8 bg-gray-200 rounded-full w-24"></div>
    </div>
    <div className="mt-3 h-4 bg-gray-200 rounded w-full"></div>
  </div>
);

export const TableRowSkeleton = ({ cols = 4 }) => (
  <tr className="animate-pulse">
    {Array(cols).fill().map((_, i) => (
      <td key={i} className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded"></div>
      </td>
    ))}
  </tr>
);