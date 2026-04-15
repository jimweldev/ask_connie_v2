import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useFormContext, useWatch } from 'react-hook-form';
import SyntaxHighlighter from 'react-syntax-highlighter';
import {
  docco,
  monokaiSublime,
} from 'react-syntax-highlighter/dist/esm/styles/hljs';
import useThemeStore from '@/05_stores/_common/theme-store';
import { Button } from '@/components/ui/button';
import convertNaming from '@/lib/naming/naming-helper';
import { type FormData } from '../crud-builder-page';
import FilenameInputGroup from './_components/filename-input-group';

const ModelTab = () => {
  const { theme } = useThemeStore();
  const [isCopied, setIsCopied] = useState(false);

  const { control } = useFormContext<FormData>();
  const formValues = useWatch<FormData>({ control });

  if (!formValues.table) return null;
  const { table, group, soft_delete, table_fields } = formValues;

  const generateModel = () => {
    // Extract field names and convert to PascalCase for PHP property names
    const fieldNames = table_fields
      ?.filter(f => f.name?.trim())
      .map(f => f.name?.trim() || '');

    let template = `<?php\n\n`;
    template += `namespace App\\Models${group ? `\\${convertNaming(group, 'PascalSingular')}` : ''};\n\n`;
    template += `use Illuminate\\Database\\Eloquent\\Model;\n`;
    template += `use Illuminate\\Database\\Eloquent\\Attributes\\Fillable;\n\n`;
    let fillableFields = '';
    if (fieldNames && fieldNames.length > 0) {
      fillableFields = `\n    ${fieldNames.map(f => `'${f}'`).join(',\n    ')}\n`;
    } else {
      fillableFields = "'*'";
    }
    template += `#[Fillable([${fillableFields}])]\n`;
    template += `class ${convertNaming(table!, 'PascalSingular')} extends Model {\n`;
    if (soft_delete) {
      template += `    use SoftDeletes;\n`;
    }
    template += `    //\n`;
    template += `}\n`;

    return template;
  };

  const code = generateModel();

  const onCopy = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <>
      <FilenameInputGroup
        tableName={`${group ? `${convertNaming(group, 'PascalSingular')}/` : ''}${convertNaming(formValues.table, 'PascalSingular')}.php`}
      />

      <div className="relative">
        <Button
          variant="ghost"
          size="icon-xs"
          className="absolute top-2 right-2 z-10"
          onClick={onCopy}
        >
          {isCopied ? <Check /> : <Copy />}
        </Button>

        <SyntaxHighlighter
          language="php"
          style={theme === 'dark' ? monokaiSublime : docco}
          showLineNumbers
          wrapLines
          customStyle={{
            maxHeight: '600px',
            overflow: 'auto',
            borderRadius: '10px',
            fontSize: '14px',
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </>
  );
};

export default ModelTab;
