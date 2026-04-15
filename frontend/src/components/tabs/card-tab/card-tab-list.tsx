import { cn } from '@/lib/utils';

type CardTabListProps = {
  children: React.ReactNode;
};

const CardTabList = ({ children }: CardTabListProps) => {
  return (
    <div className={cn('border-b p-4 pb-0', 'text-sm', 'font-medium')}>
      {children}
    </div>
  );
};

export default CardTabList;
