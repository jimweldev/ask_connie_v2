import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Input } from '@/components/ui/input';

type FilenameInputGroupProps = {
  tableName: string;
};

const FilenameInputGroup = ({ tableName }: FilenameInputGroupProps) => {
  const [isCopied, setIsCopied] = useState(false);

  const onCopy = () => {
    navigator.clipboard.writeText(tableName);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <ButtonGroup className="mb-4 w-full">
      <Input inputSize="sm" value={tableName} readOnly />
      <Button size="sm" onClick={onCopy}>
        {isCopied ? 'Copied!' : 'Copy'}
      </Button>
    </ButtonGroup>
  );
};

export default FilenameInputGroup;
