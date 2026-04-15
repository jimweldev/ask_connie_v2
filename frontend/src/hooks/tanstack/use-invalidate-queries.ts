import { useQueryClient } from '@tanstack/react-query';

const useInvalidateQueries = () => {
  const queryClient = useQueryClient();

  return (queryKeys: string[]) => {
    queryKeys.forEach(queryKey => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.removeQueries({ queryKey: [queryKey] });
    });
  };
};

export default useInvalidateQueries;
