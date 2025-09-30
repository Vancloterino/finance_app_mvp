import { useState, useEffect, useCallback } from 'react';
import { ApiError } from '../types';

// Generic hook for API calls with loading and error states
export function useApi<T>(
  apiFunction: () => Promise<T>,
  immediate: boolean = true
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction();
      setData(result);
      return result;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  const refetch = useCallback(() => {
    return execute();
  }, [execute]);

  return {
    data,
    loading,
    error,
    execute,
    refetch,
    reset,
  };
}

// Hook for mutations (POST, PUT, DELETE operations)
export function useMutation<TData, TVariables = void>(
  mutationFunction: (variables: TVariables) => Promise<TData>
) {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData> => {
      try {
        setLoading(true);
        setError(null);
        const result = await mutationFunction(variables);
        setData(result);
        return result;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [mutationFunction]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    mutate,
    reset,
  };
}

// Hook for paginated data
export function usePaginatedApi<T>(
  apiFunction: (page: number, perPage: number) => Promise<{ items: T[]; total: number; page: number; per_page: number; total_pages: number }>,
  initialPage: number = 1,
  initialPerPage: number = 10
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(initialPage);
  const [perPage, setPerPage] = useState<number>(initialPerPage);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchData = useCallback(
    async (pageNum: number = page, itemsPerPage: number = perPage) => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiFunction(pageNum, itemsPerPage);
        setData(result.items);
        setTotal(result.total);
        setTotalPages(result.total_pages);
        setPage(result.page);
        setPerPage(result.per_page);
        return result;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction, page, perPage]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
    fetchData(newPage, perPage);
  }, [fetchData, perPage]);

  const changePerPage = useCallback((newPerPage: number) => {
    setPerPage(newPerPage);
    setPage(1);
    fetchData(1, newPerPage);
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData(page, perPage);
  }, [fetchData, page, perPage]);

  return {
    data,
    loading,
    error,
    page,
    perPage,
    total,
    totalPages,
    goToPage,
    changePerPage,
    refresh,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

// Hook for optimistic updates
export function useOptimisticUpdate<T>(
  initialData: T[],
  keyField: keyof T = 'id' as keyof T
) {
  const [data, setData] = useState<T[]>(initialData);

  const addOptimistic = useCallback((item: T) => {
    setData(prev => [...prev, item]);
  }, []);

  const updateOptimistic = useCallback((updatedItem: T) => {
    setData(prev =>
      prev.map(item =>
        item[keyField] === updatedItem[keyField] ? updatedItem : item
      )
    );
  }, [keyField]);

  const removeOptimistic = useCallback((itemKey: T[keyof T]) => {
    setData(prev => prev.filter(item => item[keyField] !== itemKey));
  }, [keyField]);

  const resetData = useCallback((newData: T[]) => {
    setData(newData);
  }, []);

  return {
    data,
    setData,
    addOptimistic,
    updateOptimistic,
    removeOptimistic,
    resetData,
  };
}

// Hook for debounced API calls (useful for search)
export function useDebouncedApi<T>(
  apiFunction: (query: string) => Promise<T>,
  delay: number = 300
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>('');

  useEffect(() => {
    if (!query.trim()) {
      setData(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiFunction(query);
        setData(result);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message);
      } finally {
        setLoading(false);
      }
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [query, apiFunction, delay]);

  return {
    data,
    loading,
    error,
    query,
    setQuery,
  };
}