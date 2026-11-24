import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DealResponse, DealStage, Paginated } from '../../api/schemas';
import { overviewKeys } from '../dashboard/api';
import { dealKeys, moveDeal } from '../deals/api';

type Board = Paginated<DealResponse>;

interface Move {
  id: string;
  stage: DealStage;
}

/**
 * Moves a deal to another stage with an optimistic update: the card jumps to its new column at
 * once, and goes back to where it was if the server refuses. Either way the board is refetched
 * afterwards, so what stays on screen is what the server has.
 */
export function useMoveDeal() {
  const queryClient = useQueryClient();
  const setStage = (id: string, stage: DealStage) =>
    queryClient.setQueryData<Board>(
      dealKeys.board,
      (board) =>
        board && {
          ...board,
          data: board.data.map((deal) => (deal.id === id ? { ...deal, stage } : deal)),
        },
    );

  return useMutation({
    mutationFn: ({ id, stage }: Move) => moveDeal(id, stage),
    onMutate: async ({ id, stage }) => {
      // An in-flight refetch would overwrite the optimistic state with the old one.
      await queryClient.cancelQueries({ queryKey: dealKeys.board });
      const previousStage = queryClient
        .getQueryData<Board>(dealKeys.board)
        ?.data.find((deal) => deal.id === id)?.stage;
      setStage(id, stage);
      return { previousStage };
    },
    onError: (_error, { id }, context) => {
      // Undo only this card, so other moves made meanwhile are not reverted with it.
      if (context?.previousStage) setStage(id, context.previousStage);
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: dealKeys.all }),
        // Won revenue, open deals and the funnel on the overview depend on the stage.
        queryClient.invalidateQueries({ queryKey: overviewKeys.all }),
      ]),
  });
}
