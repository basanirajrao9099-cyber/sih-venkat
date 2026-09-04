export type StatusType = 
  | 'active' 
  | 'recruiting' 
  | 'completed' 
  | 'suspended' 
  | 'terminated' 
  | 'draft' 
  | 'under_review' 
  | 'approved' 
  | 'rejected' 
  | 'pending'
  | 'critical'
  | 'warning'
  | 'healthy';

export interface ApiResponse<T> {
  data: T;
  total?: number;
  message?: string;
  timestamp: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: ToastType;
  duration?: number;
}
