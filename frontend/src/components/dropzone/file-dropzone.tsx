import { CloudUploadIcon, Paperclip, Trash2 } from 'lucide-react';
import Dropzone from 'react-dropzone';
import { formatFileSize } from '@/lib/react-dropzone/format-file-size';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { ButtonGroup } from '../ui/button-group';
import { Input } from '../ui/input';

interface FileDropzoneProps extends React.ComponentPropsWithoutRef<
  typeof Dropzone
> {
  isInvalid?: boolean;
  files?: File[] | File;
  isMultiple?: boolean;
  onRemove?: (file: File) => void;
  setFiles?: (files: File[]) => void;
}

const FileDropzone = ({
  isInvalid,
  files,
  isMultiple = false,
  onRemove,
  setFiles,
  ...props
}: FileDropzoneProps) => {
  const normalizedFiles: File[] = Array.isArray(files)
    ? files
    : files
      ? [files]
      : [];

  const handleRename = (index: number, newName: string) => {
    if (!normalizedFiles[index] || !setFiles) return;

    const oldFile = normalizedFiles[index];
    const newFile = new File([oldFile], newName, {
      type: oldFile.type,
      lastModified: oldFile.lastModified,
    });

    const updatedFiles = [...normalizedFiles];
    updatedFiles[index] = newFile;
    setFiles(updatedFiles);
  };

  return (
    <Dropzone multiple={isMultiple} {...props}>
      {({ getRootProps, getInputProps, isDragActive }) => (
        <div>
          <div
            className={cn(
              'flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center hover:bg-muted',
              isDragActive
                ? 'border-primary text-primary'
                : 'border-muted-foreground text-muted-foreground',
              isInvalid
                ? 'border-destructive bg-destructive/10 text-destructive'
                : '',
            )}
            {...getRootProps()}
          >
            <input {...getInputProps()} />
            <CloudUploadIcon size={40} />
            <p>
              {isDragActive ? (
                <span>Drop the file{isMultiple ? 's' : ''} here...</span>
              ) : (
                <span>
                  Drag and drop file{isMultiple ? 's' : ''} here, or click to
                  select file{isMultiple ? 's' : ''}
                </span>
              )}
            </p>
          </div>

          {normalizedFiles.length > 0 &&
            (setFiles ? (
              <div className="mt-1 space-y-1">
                {normalizedFiles.map((file, index) => {
                  const fullName = file.name;
                  const lastDotIndex = fullName.lastIndexOf('.');
                  const nameWithoutExt =
                    lastDotIndex !== -1
                      ? fullName.slice(0, lastDotIndex)
                      : fullName;
                  const extension =
                    lastDotIndex !== -1 ? fullName.slice(lastDotIndex + 1) : '';

                  return (
                    <div key={index}>
                      <ButtonGroup className="w-full">
                        <Input
                          inputSize="sm"
                          value={nameWithoutExt}
                          onChange={e =>
                            handleRename(
                              index,
                              extension
                                ? `${e.target.value}.${extension}`
                                : e.target.value,
                            )
                          }
                          aria-invalid={isInvalid && nameWithoutExt === ''}
                        />
                        <Input
                          inputSize="sm"
                          className="max-w-[50px] truncate"
                          value={extension}
                          readOnly
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onRemove?.(file)}
                        >
                          <Trash2 />
                        </Button>
                      </ButtonGroup>

                      {isInvalid && nameWithoutExt === '' ? (
                        <p className="mt-1 text-xs text-destructive">
                          Invalid filename
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <ul className="mt-1">
                {normalizedFiles.map((file, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between rounded p-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-muted-foreground"
                  >
                    <h6 className="flex items-center gap-1">
                      <Paperclip className="size-2.5 shrink-0" />
                      <span>
                        {file.name} ({formatFileSize(file.size)})
                      </span>
                    </h6>
                    <button
                      type="button"
                      className="rounded p-1 hover:text-red-500"
                      onClick={() => onRemove?.(file)}
                    >
                      <Trash2 className="size-2.5 shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            ))}
        </div>
      )}
    </Dropzone>
  );
};

export default FileDropzone;
