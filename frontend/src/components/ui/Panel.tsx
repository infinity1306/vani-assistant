import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';

interface PanelProps extends HTMLMotionProps<"div"> {
  layer?: 2 | 3 | 4;
  glass?: boolean;
}

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ className, layer = 2, glass = false, children, ...props }, ref) => {
    
    // Depth layer maps to specific z-indexes as dictated by OS architecture
    const layerClass = layer === 2 ? 'z-20' : layer === 3 ? 'z-40' : 'z-50';
    
    return (
      <motion.div
        ref={ref}
        className={cn(
          "vani-panel",
          layerClass,
          !glass && "vani-glass-none",
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Panel.displayName = 'Panel';
