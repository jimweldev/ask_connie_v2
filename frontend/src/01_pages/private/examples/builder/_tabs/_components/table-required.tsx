import { FaTable } from 'react-icons/fa6';

const TableRequired = () => {
  return (
    <div className="flex flex-col items-center justify-center p-4 text-muted-foreground">
      <div className="p-4">
        <FaTable className="size-12" />
      </div>
      <p className="text-center text-sm">Table name is required</p>
    </div>
  );
};

export default TableRequired;
