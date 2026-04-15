import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { PaginationParams } from '@/04_types/_common/pagination';
import type { SystemDropdown } from '@/04_types/system/system-dropdown';

type SystemDropdownStoreProps = {
  selectedSystemDropdown: SystemDropdown | null;
  setSelectedSystemDropdown: (systemDropdown: SystemDropdown | null) => void;

  pagination: PaginationParams;
  setPagination: (data: Partial<PaginationParams>) => void;

  view: 'list' | 'grid';
  setView: (view: 'list' | 'grid') => void;
};

const defaultPagination: PaginationParams = {
  limit: '15',
  page: 1,
  sort: 'label',
  searchTerm: '',
};

const useSystemDropdownStore = create<SystemDropdownStoreProps>()(
  persist(
    set => ({
      selectedSystemDropdown: null,
      setSelectedSystemDropdown: systemDropdown =>
        set({ selectedSystemDropdown: systemDropdown }),

      pagination: defaultPagination,

      setPagination: data =>
        set(state => ({
          pagination: { ...state.pagination, ...data },
        })),

      view: 'list',
      setView: view => set({ view }),
    }),
    {
      name: 'system-dropdown-preferences',
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
              // Start with defaults
              ...merged.pagination,
              // Apply only persisted fields (limit)
              ...persistedPagination,
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

export default useSystemDropdownStore;
