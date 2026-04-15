'use client';

import { createContext, useContext } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// === Context Setup ===
type TabsVariantContextType = {
  variant?: 'default' | 'outline' | 'pills' | 'underline' | null;
  size?: 'default' | 'sm' | 'lg' | null;
};

const TabsVariantContext = createContext<TabsVariantContextType>({});
const useTabsVariant = () => useContext(TabsVariantContext);

// === Tabs Root ===
function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col', className)}
      {...props}
    />
  );
}

// === Tabs List ===
const tabsListVariants = cva('font-medium', {
  variants: {
    variant: {
      default: 'w-fit rounded-md bg-muted p-1 text-muted-foreground',
      outline: 'border-b p-4 pb-0',
      pills: 'w-fit',
      underline: 'border-b-2 p-4 pb-0',
    },
    size: {
      default: 'text-sm',
      sm: 'text-xs',
      lg: 'text-base',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

function TabsList({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsVariantContext.Provider value={{ variant, size }}>
      <TabsPrimitive.List
        data-slot="tabs-list"
        className={cn(tabsListVariants({ variant, size, className }))}
        {...props}
      />
    </TabsVariantContext.Provider>
  );
}

// === Tabs Trigger ===
const tabsTriggerVariants = cva(
  'inline-flex items-center justify-center gap-2',
  {
    variants: {
      variant: {
        default:
          'rounded-md border border-transparent data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:text-card-foreground',
        outline:
          'mb-[-1px] rounded-t-md border border-b-0 border-transparent data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:text-card-foreground',
        pills:
          'rounded-full data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground',
        underline:
          'mb-[-2px] data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary',
      },
      size: {
        default: 'px-3 py-1',
        sm: '-m-0.5 px-3 py-1',
        lg: 'px-5 py-2',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> &
  VariantProps<typeof tabsTriggerVariants>) {
  const { variant, size } = useTabsVariant();

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(tabsTriggerVariants({ variant, size, className }))}
      {...props}
    />
  );
}

// === Tabs Content ===
function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        'flex-1 outline-none',
        'data-[state=inactive]:hidden',
        className,
      )}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
