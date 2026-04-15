import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { PaginationParams } from '@/04_types/_common/pagination';
import type { ExampleTask } from '@/04_types/example/example-task';

type ExampleTaskStoreProps = {
  selectedExampleTask: ExampleTask | null;
  setSelectedExampleTask: (exampleTask: ExampleTask | null) => void;

  pagination: PaginationParams;
  setPagination: (data: Partial<PaginationParams>) => void;

  view: 'list' | 'grid';
  setView: (view: 'list' | 'grid') => void;
};

const defaultPagination: PaginationParams = {
  limit: '15',
  page: 1,
  sort: 'name,id',
  searchTerm: '',
};

const useExampleTaskStore = create<ExampleTaskStoreProps>()(
  persist(
    set => ({
      selectedExampleTask: null,
      setSelectedExampleTask: exampleTask =>
        set({ selectedExampleTask: exampleTask }),

      pagination: defaultPagination,

      setPagination: data =>
        set(state => ({
          pagination: { ...state.pagination, ...data },
        })),

      view: 'list',
      setView: view => set({ view }),
    }),
    {
      name: 'example-tasks',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        view: state.view,
        pagination: {
          limit: state.pagination.limit,
        },
      }),
      merge: (persistedState, currentState) => {
        // Start with current state (defaults)
        const merged = { ...currentState };

        // Only override persisted values
        if (persistedState && typeof persistedState === 'object') {
          if ('view' in persistedState && persistedState.view) {
            merged.view = persistedState.view as 'list' | 'grid';
          }

          if ('pagination' in persistedState && persistedState.pagination) {
            const persistedPagination =
              persistedState.pagination as Partial<PaginationParams>;
            merged.pagination = {
              ...merged.pagination, // Start with defaults
              ...persistedPagination, // Apply only persisted fields (limit)
              // Explicitly reset non-persisted fields to defaults
              page: defaultPagination.page,
              sort: defaultPagination.sort,
              searchTerm: defaultPagination.searchTerm,
            };
          }
        }

        return merged;
      },
    },
  ),
);

export default useExampleTaskStore;
