import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useFormContext, useWatch } from 'react-hook-form';
import ReactSelect from 'react-select';
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

const CreateTab = () => {
  const { theme } = useThemeStore();
  const [isCopied, setIsCopied] = useState(false);
  const [submitType, setSubmitType] = useState<
    'submitAndClose' | 'submitAndKeepOpen'
  >('submitAndClose');

  const { control } = useFormContext<FormData>();
  const formValues = useWatch<FormData>({ control });

  if (!formValues.table) return null;

  const { table, route, table_fields } = formValues;
  const modelName = convertNaming(table, 'PascalSingular');
  const kebabTable = convertNaming(table, 'KebabSingular');

  // Helper function to get readable label without pluralization issues
  const getReadableLabel = (fieldName: string) => {
    // Convert snake_case or camelCase to readable format
    return fieldName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Check for file upload fields (fields ending with _path)
  const fileFields =
    table_fields
      ?.filter(
        field =>
          field.name && field.name.endsWith('_path') && field.type === 'string',
      )
      .map(field => ({
        name: field.name as string,
        uploadName: (field.name as string).replace(/_path$/, ''),
        readableName: getReadableLabel(
          (field.name as string).replace(/_path$/, ''),
        ),
      })) || [];

  // Regular fields (excluding file fields and boolean fields)
  const regularFields =
    table_fields?.filter(
      (f): f is { name: string; type: string } =>
        !!(f.name && f.name.trim() !== '' && f.type) &&
        !f.name.endsWith('_path') &&
        f.type !== 'boolean',
    ) || [];

  const booleanFields =
    table_fields?.filter(
      (f): f is { name: string; type: string } =>
        !!(f.name && f.name.trim() !== '' && f.type) && f.type === 'boolean',
    ) || [];

  // Helper function to get zod schema based on field type
  const getZodSchema = (fieldType: string, isFileField = false) => {
    if (isFileField) {
      return 'createReactDropzoneSchema()';
    }
    switch (fieldType) {
      case 'integer':
        return 'createInputIntegerSchema()';
      case 'decimal':
        return 'createInputDecimalSchema()';
      case 'boolean':
        return "z.enum(['0', '1'])";
      case 'json':
        return 'createInputJsonSchema()';
      default:
        return "z.string().min(1, { message: 'Required' })";
    }
  };

  // Helper function to get default value based on field type
  const getDefaultValue = (fieldType: string, isFileField = false) => {
    if (isFileField) {
      return 'undefined';
    }
    switch (fieldType) {
      case 'boolean':
        return "'0'";
      default:
        return "''";
    }
  };

  const generateCreateDialog = () => {
    // Generate form schema fields for all fields (including file fields)
    const formSchemaFields = [
      ...regularFields.map(field => {
        const zodSchema = getZodSchema(field.type);
        return `  ${field.name}: ${zodSchema},`;
      }),
      ...booleanFields.map(field => {
        const zodSchema = getZodSchema(field.type);
        return `  ${field.name}: ${zodSchema},`;
      }),
      ...fileFields.map(field => {
        const zodSchema = getZodSchema('file', true);
        return `  ${field.uploadName}: ${zodSchema},`;
      }),
    ].join('\n');

    // Generate form fields JSX
    const formFields = [
      // Regular input fields
      ...regularFields.map(field => {
        const readableLabel = getReadableLabel(field.name);
        return `                {/* ${readableLabel} Field */}
                <FormField
                  control={form.control}
                  name="${field.name}"
                  render={({ field }) => (
                    <FormItem className="col-span-12">
                      <FormLabel>${readableLabel}</FormLabel>
                      <FormControl>
                        <Input {...field} ${field.type === 'integer' || field.type === 'decimal' ? 'type="number"' : ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />`;
      }),

      // Boolean fields with Switch
      ...booleanFields.map(field => {
        const readableLabel = getReadableLabel(field.name);
        return `                {/* ${readableLabel} Field */}
                <FormField
                  control={form.control}
                  name="${field.name}"
                  render={({ field }) => {
                    const boolValue = field.value === '1';
                    return (
                      <FormItem className="col-span-12 flex items-center justify-between gap-2">
                        <FormLabel className="mb-0 cursor-pointer">${readableLabel}</FormLabel>
                        <FormControl>
                          <Switch
                            checked={boolValue}
                            onCheckedChange={(checked) => field.onChange(checked ? '1' : '0')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />`;
      }),

      // File upload fields
      ...fileFields.map(field => {
        return `                {/* ${field.readableName} Field */}
                <FormField
                  control={form.control}
                  name="${field.uploadName}"
                  render={({ field, fieldState }) => (
                    <FormItem className="col-span-12">
                      <FormLabel>${field.readableName}</FormLabel>
                      <FormControl>
                        <FileDropzone
                          isInvalid={fieldState.invalid}
                          setFiles={files => field.onChange(files[0])}
                          files={field.value}
                          onDrop={(acceptedFiles, rejectedFiles) => {
                            field.onChange(acceptedFiles[0]);
                            handleRejectedFiles(rejectedFiles);
                          }}
                          onRemove={() => {
                            field.onChange(undefined);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />`;
      }),
    ].join('\n');

    // Generate default values
    const defaultValues = [
      ...regularFields.map(field => {
        const defaultValue = getDefaultValue(field.type);
        return `      ${field.name}: ${defaultValue},`;
      }),
      ...booleanFields.map(field => {
        const defaultValue = getDefaultValue(field.type);
        return `      ${field.name}: ${defaultValue},`;
      }),
      ...fileFields.map(field => {
        const defaultValue = getDefaultValue('file', true);
        return `      ${field.uploadName}: ${defaultValue},`;
      }),
    ].join('\n');

    // Generate FormData append statements for onSubmit
    const formDataAppends = [
      ...regularFields.map(
        field => `    formData.append('${field.name}', data.${field.name});`,
      ),
      ...booleanFields.map(
        field => `    formData.append('${field.name}', data.${field.name});`,
      ),
      ...fileFields.map(
        field => `    if (data.${field.uploadName}) {
      formData.append('${field.uploadName}', data.${field.uploadName});
    }`,
      ),
    ].join('\n');

    const isKeepOpen = submitType === 'submitAndKeepOpen';

    // Generate imports based on field types
    const zodImports = [];
    if (regularFields.some(f => f.type === 'integer'))
      zodImports.push('createInputIntegerSchema');
    if (regularFields.some(f => f.type === 'decimal'))
      zodImports.push('createInputDecimalSchema');
    if (regularFields.some(f => f.type === 'json'))
      zodImports.push('createInputJsonSchema');
    if (fileFields.length > 0) zodImports.push('createReactDropzoneSchema');

    const zodImportStatement =
      zodImports.length > 0
        ? `import { ${zodImports.join(', ')} } from '@/lib/zod/zod-helpers';`
        : '';

    // Check if we need to import Switch component
    const hasBooleanFields = booleanFields.length > 0;
    const switchImport = hasBooleanFields
      ? `import { Switch } from '@/components/ui/switch';`
      : '';

    // Check if we need to import FileDropzone and handleRejectedFiles
    const hasFileFields = fileFields.length > 0;
    const fileImports = hasFileFields
      ? `import FileDropzone from '@/components/dropzone/file-dropzone';
import { handleRejectedFiles } from '@/lib/react-dropzone/handle-rejected-files';`
      : '';

    // FOOTER
    const footer = isKeepOpen
      ? `              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <ButtonGroup>
                <Button type="submit" disabled={isLoadingCreateItem}>
                  Submit
                </Button>
                <ButtonGroupSeparator />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button disabled={isLoadingCreateItem}>
                      <ChevronDownIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuGroup>
                      <DropdownMenuItem onClick={() => form.handleSubmit(data => onSubmit(data, false))()}>
                        Submit & Close
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => form.handleSubmit(data => onSubmit(data, true))()}>
                        Submit & Keep Open
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </ButtonGroup>`
      : `              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoadingCreateItem}>Submit</Button>`;

    // onSubmit function
    const onSubmitFn = isKeepOpen
      ? `
  const onSubmit = (data: z.infer<typeof FormSchema>, keepOpen = false) => {
    const formData = new FormData();
${formDataAppends}

    setIsLoadingCreateItem(true);

    toast.promise(mainInstance.post(\`${route}\`, formData), {
      loading: 'Loading...',
      success: () => {
        refetch();
        if (!keepOpen) {
          form.reset();
          setOpen(false);
        }
        return 'Success!';
      },
      error: error =>
        error.response?.data?.message || error.message || 'An error occurred',
      finally: () => setIsLoadingCreateItem(false),
    });
  };`
      : `
  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    const formData = new FormData();
${formDataAppends}

    setIsLoadingCreateItem(true);

    toast.promise(mainInstance.post(\`${route}\`, formData), {
      loading: 'Loading...',
      success: () => {
        form.reset();
        refetch();
        setOpen(false);
        return 'Success!';
      },
      error: error =>
        error.response?.data?.message || error.message || 'An error occurred',
      finally: () => setIsLoadingCreateItem(false),
    });
  };`;

    // IMPORTS: array + filter(Boolean) ensures no blank lines
    const importsArr = [
      `import { useState } from 'react';`,
      `import { zodResolver } from '@hookform/resolvers/zod';`,
      isKeepOpen ? `import { ChevronDownIcon } from 'lucide-react';` : null,
      `import { useForm } from 'react-hook-form';`,
      `import { toast } from 'sonner';`,
      `import { z } from 'zod';`,
      zodImportStatement,
      switchImport,
      fileImports,
      `import { mainInstance } from '@/07_instances/main-instance';`,
      `import { Button } from '@/components/ui/button';`,
      isKeepOpen
        ? `import { ButtonGroup, ButtonGroupSeparator } from '@/components/ui/button-group';`
        : null,
      `import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';`,
      isKeepOpen
        ? `import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';`
        : null,
      `import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';`,
      `import { Input } from '@/components/ui/input';`,
    ];

    const imports = importsArr.filter(Boolean).join('\n');

    return `${imports}

// Form validation schema
const FormSchema = z.object({
${formSchemaFields}
});

// Props
type Create${modelName}DialogProps = {
  open: boolean;
  setOpen: (value: boolean) => void;
  refetch: () => void;
};

const Create${modelName}Dialog = ({ open, setOpen, refetch }: Create${modelName}DialogProps) => {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
${defaultValues}
    },
  });

  const [isLoadingCreateItem, setIsLoadingCreateItem] = useState(false);

  ${onSubmitFn}

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent autoFocus>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(d => onSubmit(d))} autoComplete="off">
            <DialogHeader>
              <DialogTitle>Create ${convertNaming(table, 'ReadableSingular')}</DialogTitle>
            </DialogHeader>

            <DialogBody>
              <div className="grid grid-cols-12 gap-3">
${formFields}
              </div>
            </DialogBody>

            <DialogFooter className="flex justify-end gap-2">
${footer}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default Create${modelName}Dialog;`;
  };

  const code = generateCreateDialog();

  const onCopy = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <>
      <FilenameInputGroup
        tableName={`_dialogs/create-${kebabTable}-dialog.tsx`}
      />

      <div className="relative z-50 mb-2 flex justify-end">
        <ReactSelect
          className="react-select-container-sm w-[250px]"
          classNamePrefix="react-select-sm"
          options={[
            { label: 'Submit & Close', value: 'submitAndClose' },
            { label: 'Submit & Keep Open', value: 'submitAndKeepOpen' },
          ]}
          value={{
            label:
              submitType === 'submitAndClose'
                ? 'Submit & Close'
                : 'Submit & Keep Open',
            value: submitType,
          }}
          onChange={option =>
            setSubmitType(
              option?.value as 'submitAndClose' | 'submitAndKeepOpen',
            )
          }
        />
      </div>

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
          language="typescript"
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

export default CreateTab;
