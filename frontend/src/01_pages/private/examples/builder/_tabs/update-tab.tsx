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

const UpdateTab = () => {
  const { theme } = useThemeStore();
  const [isCopied, setIsCopied] = useState(false);

  const { control } = useFormContext<FormData>();
  const formValues = useWatch<FormData>({ control });

  if (!formValues.table) return null;

  const { group, table, route, table_fields } = formValues;

  // Convert table name to PascalCase for model and camelCase for store variable
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
      return 'createReactDropzoneSchema(false)';
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

  // Helper function to convert value based on field type
  const getValueConversion = (fieldName: string, fieldType: string) => {
    switch (fieldType) {
      case 'integer':
      case 'decimal':
        return `${fieldName}: selected${modelName}.${fieldName}?.toString() || ''`;
      case 'boolean':
        return `${fieldName}: selected${modelName}.${fieldName} ? '1' : '0'`;
      default:
        return `${fieldName}: selected${modelName}.${fieldName} || ''`;
    }
  };

  const generateUpdateDialog = () => {
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

    // Generate reset values (populate form with selected item's data)
    const resetValues = [
      ...regularFields.map(field => getValueConversion(field.name, field.type)),
      ...booleanFields.map(field => getValueConversion(field.name, field.type)),
      // File fields should not be included in reset (they are optional)
    ]
      .filter(Boolean)
      .join(',\n');

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

    return `import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
${zodImportStatement}
${switchImport}
${fileImports}
import use${modelName}Store from '@/05_stores${group ? `/${convertNaming(group, 'KebabSingular')}` : ''}/${kebabTable}-store';
import { mainInstance } from '@/07_instances/main-instance';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

// Form validation schema
const FormSchema = z.object({
${formSchemaFields}
});

// Props
type Update${modelName}DialogProps = {
  open: boolean;                 // Dialog open state
  setOpen: (value: boolean) => void; // Function to open/close dialog
  refetch: () => void;           // Function to refetch the table data after update
};

const Update${modelName}Dialog = ({ open, setOpen, refetch }: Update${modelName}DialogProps) => {
  // Zustand store
  const { selected${modelName} } = use${modelName}Store();

  // Initialize react-hook-form with Zod resolver
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
${defaultValues}
    },
  });

  // Populate form with selected item's data
  useEffect(() => {
    if (selected${modelName}) {
      form.reset({
${resetValues}
      });
    }
  }, [selected${modelName}, form]);

  // Loading state for submit button
  const [isLoadingUpdate, setIsLoadingUpdate] = useState(false);

  // Handle form submission
  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    const formData = new FormData();
${formDataAppends}
    
    // Add _method field for Laravel to interpret as PATCH request
    formData.append('_method', 'PATCH');

    setIsLoadingUpdate(true);

    toast.promise(
      mainInstance.post(\`${route}/\${selected${modelName}?.id}\`, formData),
      {
        loading: 'Loading...',
        success: () => {
          refetch();
          setOpen(false);
          return 'Success!';
        },
        error: error => error.response?.data?.message || error.message || 'An error occurred',
        finally: () => setIsLoadingUpdate(false), // Reset loading state
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
            <DialogHeader>
              <DialogTitle>Update ${convertNaming(table, 'ReadableSingular')}</DialogTitle>
            </DialogHeader>

            <DialogBody>
              <div className="grid grid-cols-12 gap-3">
${formFields}
              </div>
            </DialogBody>

            <DialogFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoadingUpdate}>Submit</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default Update${modelName}Dialog;`;
  };

  const code = generateUpdateDialog();

  const onCopy = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <>
      {/* Filename display */}
      <FilenameInputGroup
        tableName={`_dialogs/update-${kebabTable}-dialog.tsx`}
      />

      {/* Code preview with copy button */}
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

export default UpdateTab;
