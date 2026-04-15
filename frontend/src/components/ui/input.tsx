import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const inputVariants = cva('', {
  variants: {
    inputSize: {
      default: 'h-9 text-sm',
      xs: 'h-5 text-[10px]',
      sm: 'h-7 text-xs',
      lg: 'h-12 text-lg',
    },
  },
  defaultVariants: {
    inputSize: 'default',
  },
});

function Input({
  className,
  type,
  inputSize,
  ...props
}: React.ComponentProps<'input'> & VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'px-3 py-1', // padding
        'w-full', // width
        'shadow-xs', // shadow
        'transition-[color,box-shadow]', // transition
        'bg-transparent', // bg
        'rounded-md', // rounded
        'outline-none', // outline
        'border border-input', // border
        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50', // focus
        'selection:bg-primary selection:text-primary-foreground', // selection
        'placeholder:text-muted-foreground', // placeholder
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50', // disabled
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40', // invalid
        type !== 'file' &&
          'read-only:pointer-events-none read-only:cursor-not-allowed read-only:text-muted-foreground', // readonly
        'file:font-medium file:text-foreground',
        type === 'file' &&
          inputSize === 'sm' &&
          'file:mt-0.5 file:mr-1 file:items-center file:font-bold',
        cn(inputVariants({ inputSize, className })),
      )}
      {...props}
    />
  );
}

export { Input };
