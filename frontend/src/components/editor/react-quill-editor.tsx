import { useMemo, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import { defaultModules, simpleModules } from '@/08_configs/react-quill.config';
import 'react-quill-new/dist/quill.snow.css';

// Define type for Quill instance
type QuillEditor = ReactQuill & {
  getEditor: () => ReactQuill;
};

interface ReactQuillEditorProps {
  type?: 'default' | 'simple';
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const ReactQuillEditor = ({
  type = 'default',
  value,
  onChange,
  placeholder,
  className = '',
}: ReactQuillEditorProps) => {
  const quillRef = useRef<QuillEditor | null>(null);

  const modules = useMemo(
    () => ({
      ...(type === 'default' ? defaultModules : simpleModules),
    }),
    [type],
  );

  return (
    <ReactQuill
      ref={quillRef}
      className={className}
      theme="snow"
      modules={modules}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
};

export default ReactQuillEditor;
