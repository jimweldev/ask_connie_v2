import type { ReactNode } from 'react';
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Tooltip as TooltipUI,
} from '../ui/tooltip';

type TooltipProps = {
  children: ReactNode;
  content: string;
};

const Tooltip = ({ children, content }: TooltipProps) => {
  return (
    <TooltipProvider>
      <TooltipUI>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>
          <p>{content}</p>
        </TooltipContent>
      </TooltipUI>
    </TooltipProvider>
  );
};

export default Tooltip;
