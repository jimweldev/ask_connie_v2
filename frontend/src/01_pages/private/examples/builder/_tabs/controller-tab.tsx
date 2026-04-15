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

const ControllerTab = () => {
  const { theme } = useThemeStore();
  const [isCopied, setIsCopied] = useState(false);

  const { control } = useFormContext<FormData>();
  const formValues = useWatch<FormData>({ control });

  if (!formValues.table) return null;
  const { table, group, table_fields } = formValues;

  // Get the first string field for search (fallback to 'id' if no string fields)
  const stringFields =
    table_fields
      ?.filter(field => field.type === 'string' && field.name)
      .map(field => field.name) || [];

  const searchFields =
    stringFields.length > 0
      ? stringFields.slice(0, 2) // Take first two string fields
      : ['id']; // Fallback to id if no string fields

  // Check for file upload fields (fields ending with _path)
  const fileFields =
    table_fields
      ?.filter(
        field =>
          field.name && field.name.endsWith('_path') && field.type === 'string',
      )
      .map(field => ({
        name: field.name,
        variable: convertNaming(field.name, 'CamelSingular'),
        uploadName: (field.name as string).replace(/_path$/, ''),
        directory: (field.name as string).replace(/_path$/, 's'), // e.g., avatar_path -> avatars
      })) || [];

  const generateController = () => {
    const className = `${convertNaming(table, 'PascalSingular')}Controller`;
    const modelName = convertNaming(table, 'PascalSingular');

    // Generate search conditions
    const searchConditions = searchFields
      .map(
        field =>
          `                        ->orWhere('${field}', 'ILIKE', '%'.$search.'%')`,
      )
      .join('\n');

    // Generate file upload handling code for store method
    const fileUploadStoreCode =
      fileFields.length > 0
        ? `            // Handle file uploads\n${fileFields
            .map(
              field => `            if ($request->hasFile('${field.uploadName}')) {
                $${field.uploadName} = $request->file('${field.uploadName}');
                $${field.variable} = StorageHelper::uploadFile($${field.uploadName}, '${field.directory}');
                if ($${field.variable}) {
                    $request['${field.name}'] = $${field.variable};
                }
            }\n`,
            )
            .join('\n')}\n`
        : '';

    // Generate file upload handling code for update method
    const fileUploadUpdateCode =
      fileFields.length > 0
        ? `            // Handle file uploads\n${fileFields
            .map(
              field => `            if ($request->hasFile('${field.uploadName}')) {
                // Delete old file if exists
                if ($record->${field.name}) {
                    StorageHelper::deleteFile($record->${field.name});
                }
                
                $${field.uploadName} = $request->file('${field.uploadName}');
                $${field.variable} = StorageHelper::uploadFile($${field.uploadName}, '${field.directory}');
                if ($${field.variable}) {
                    $request['${field.name}'] = $${field.variable};
                }
            }\n`,
            )
            .join('\n')}\n`
        : '';

    // Generate file cleanup code for destroy method
    const fileCleanupCode =
      fileFields.length > 0
        ? `\n            // Delete associated files
            ${fileFields
              .map(
                field => `if ($record->${field.name}) {
                StorageHelper::deleteFile($record->${field.name});
            }\n`,
              )
              .join('\n            ')}`
        : '';

    // Check if we need to import StorageHelper
    const hasFileFields = fileFields.length > 0;
    const storageHelperImport = hasFileFields
      ? `use App\\Helpers\\StorageHelper;\n`
      : '';

    let template = `<?php\n\n`;

    template += `namespace App\\Http\\Controllers${group ? `\\${convertNaming(group, 'PascalSingular')}` : ''};\n\n`;
    template += `use Illuminate\\Http\\Request;\n`;
    template += `use Illuminate\\Http\\JsonResponse;\n`;
    template += `use App\\Http\\Controllers\\Controller;\n`;
    template += `use App\\Models${group ? `\\${convertNaming(group, 'PascalSingular')}` : ''}\\${modelName};\n`;
    template += `use App\\Helpers\\DynamicLogger;\n`;
    template += `use App\\Helpers\\QueryHelper;\n`;
    template += `${storageHelperImport}\n`;

    template += `/**\n`;
    template += ` * Class ${className}\n`;
    template += ` *\n`;
    template += ` * Controller for managing ${modelName} resources.\n`;
    template += ` * Provides CRUD operations with filtering, sorting, and pagination support.\n`;
    template += ` */\n`;
    template += `class ${className} extends Controller {\n`;
    template += `    private $logger;\n\n`;
    template += `    public function __construct() {\n`;
    template += `        $this->logger = DynamicLogger::create('laravel.log', 'local');\n`;
    template += `    }\n\n`;

    template += `    /**\n`;
    template += `     * Display a paginated list of records with optional filtering and search.\n`;
    template += `     *\n`;
    template += `     * @param  Request  $request  The HTTP request instance\n`;
    template += `     */\n`;
    template += `    public function index(Request $request): JsonResponse {\n`;
    template += `        $queryParams = $request->all();\n\n`;
    template += `        try {\n`;
    template += `            // Build the base query\n`;
    template += `            $query = ${modelName}::query();\n\n`;
    template += `            // Apply query filters (sorting, advanced filters, group filters)\n`;
    template += `            QueryHelper::apply($query, $queryParams);\n\n`;
    template += `            // Apply search across searchable fields\n`;
    template += `            if ($request->has('search')) {\n`;
    template += `                $search = $request->input('search');\n`;
    template += `                $query->where(function ($query) use ($search) {\n`;
    template += `                    $query->where('id', 'ILIKE', '%'.$search.'%')\n`;
    template += `${searchConditions};\n`;
    template += `                });\n`;
    template += `            }\n\n`;
    template += `            // Get total count before pagination\n`;
    template += `            $totalRecords = $query->count();\n\n`;
    template += `            // Apply pagination\n`;
    template += `            $limit = $request->input('limit', 10);\n`;
    template += `            $page = $request->input('page', 1);\n`;
    template += `            QueryHelper::applyLimitAndOffset($query, $limit, $page);\n\n`;
    template += `            // Execute query and return results\n`;
    template += `            $records = $query->get();\n\n`;
    template += `            return response()->json([\n`;
    template += `                'records' => $records,\n`;
    template += `                'meta' => [\n`;
    template += `                    'total_records' => $totalRecords,\n`;
    template += `                    'total_pages' => ceil($totalRecords / $limit),\n`;
    template += `                ],\n`;
    template += `            ], 200);\n`;
    template += `        } catch (\\Exception $e) {\n`;
    template += `            return response()->json([\n`;
    template += `                'message' => 'An error occurred',\n`;
    template += `                'error' => $e->getMessage(),\n`;
    template += `            ], 400);\n`;
    template += `        }\n`;
    template += `    }\n\n`;

    template += `    /**\n`;
    template += `     * Display the specified record.\n`;
    template += `     *\n`;
    template += `     * @param  int  $id  The record ID\n`;
    template += `     */\n`;
    template += `    public function show($id): JsonResponse {\n`;
    template += `        $record = ${modelName}::where('id', $id)->first();\n\n`;
    template += `        if (!$record) {\n`;
    template += `            return response()->json([\n`;
    template += `                'message' => 'Record not found.',\n`;
    template += `            ], 404);\n`;
    template += `        }\n\n`;
    template += `        return response()->json($record, 200);\n`;
    template += `    }\n\n`;

    template += `    /**\n`;
    template += `     * Store a newly created record in storage.\n`;
    template += `     *\n`;
    template += `     * @param  Request  $request  The HTTP request instance\n`;
    template += `     */\n`;
    template += `    public function store(Request $request): JsonResponse {\n`;
    template += `        try {\n`;
    template += `${fileUploadStoreCode}`;
    template += `            $record = ${modelName}::create($request->all());\n\n`;
    template += `            return response()->json($record, 201);\n`;
    template += `        } catch (\\Exception $e) {\n`;
    template += `            return response()->json([\n`;
    template += `                'message' => 'An error occurred',\n`;
    template += `                'error' => $e->getMessage(),\n`;
    template += `            ], 400);\n`;
    template += `        }\n`;
    template += `    }\n\n`;

    template += `    /**\n`;
    template += `     * Update the specified record in storage.\n`;
    template += `     *\n`;
    template += `     * @param  Request  $request  The HTTP request instance\n`;
    template += `     * @param  int  $id  The record ID\n`;
    template += `     */\n`;
    template += `    public function update(Request $request, $id): JsonResponse {\n`;
    template += `        try {\n`;
    template += `            $record = ${modelName}::find($id);\n\n`;
    template += `            if (!$record) {\n`;
    template += `                return response()->json([\n`;
    template += `                    'message' => 'Record not found.',\n`;
    template += `                ], 404);\n`;
    template += `            }\n\n`;
    template += `${fileUploadUpdateCode}`;
    template += `            $record->update($request->all());\n\n`;
    template += `            return response()->json($record, 200);\n`;
    template += `        } catch (\\Exception $e) {\n`;
    template += `            return response()->json([\n`;
    template += `                'message' => 'An error occurred',\n`;
    template += `                'error' => $e->getMessage(),\n`;
    template += `            ], 400);\n`;
    template += `        }\n`;
    template += `    }\n\n`;

    template += `    /**\n`;
    template += `     * Remove the specified record from storage.\n`;
    template += `     *\n`;
    template += `     * @param  int  $id  The record ID\n`;
    template += `     */\n`;
    template += `    public function destroy($id): JsonResponse {\n`;
    template += `        try {\n`;
    template += `            $record = ${modelName}::find($id);\n\n`;
    template += `            if (!$record) {\n`;
    template += `                return response()->json([\n`;
    template += `                    'message' => 'Record not found.',\n`;
    template += `                ], 404);\n`;
    template += `            }\n`;
    template += `${fileCleanupCode}\n`;
    template += `            $record->delete();\n\n`;
    template += `            return response()->json($record, 200);\n`;
    template += `        } catch (\\Exception $e) {\n`;
    template += `            return response()->json([\n`;
    template += `                'message' => 'An error occurred',\n`;
    template += `                'error' => $e->getMessage(),\n`;
    template += `            ], 400);\n`;
    template += `        }\n`;
    template += `    }\n`;
    template += `}\n`;

    return template;
  };

  const code = generateController();

  const onCopy = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <>
      <FilenameInputGroup
        tableName={`${group ? `${convertNaming(group, 'PascalSingular')}/` : ''}${convertNaming(formValues.table, 'PascalSingular')}Controller.php`}
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

export default ControllerTab;
