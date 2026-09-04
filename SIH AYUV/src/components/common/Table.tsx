import React from 'react';
import { cn } from '../../utils/cn';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  className?: string;
  headerClassName?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  emptyMessage?: string;
  className?: string;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No records found.',
  className,
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
}: TableProps<T>) {
  return (
    <div className={cn('w-full overflow-hidden rounded-2xl border border-[#E8E4D9] bg-white shadow-xs', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-[#26352D]">
          <thead className="bg-[#FAF9F4] text-xs uppercase tracking-wider text-[#66736B] font-mono font-bold border-b border-[#E8E4D9]">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={cn('px-4 py-3.5 select-none', col.headerClassName)}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E4D9]">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-[#66736B]">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#2E7D5B] border-t-transparent rounded-full animate-spin" />
                    <span className="font-semibold text-xs">Loading clinical records...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-[#66736B] font-medium text-xs">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={keyExtractor(row, rowIdx)}
                  className="transition-colors hover:bg-[#F5F1E8]/70"
                >
                  {columns.map((col, colIdx) => {
                    let cellContent: React.ReactNode;
                    if (typeof col.accessor === 'function') {
                      cellContent = col.accessor(row);
                    } else if (col.accessor) {
                      cellContent = row[col.accessor] as unknown as React.ReactNode;
                    } else {
                      cellContent = null;
                    }

                    return (
                      <td key={colIdx} className={cn('px-4 py-3.5 align-middle text-xs', col.className)}>
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages && totalPages > 1 && onPageChange && currentPage && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#E8E4D9] bg-[#FAF9F4] text-xs text-[#66736B]">
          <span>
            Page <span className="font-bold text-[#26352D]">{currentPage}</span> of{' '}
            <span className="font-bold text-[#26352D]">{totalPages}</span>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-[#E8E4D9] bg-white text-[#26352D] hover:bg-[#F5F1E8] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-[#E8E4D9] bg-white text-[#26352D] hover:bg-[#F5F1E8] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
