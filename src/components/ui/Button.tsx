import React, { ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils';
import { motion, HTMLMotionProps } from 'motion/react';

interface ButtonProps extends Omit<HTMLMotionProps<"button">, 'ref'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  className, 
  variant = 'primary', 
  size = 'md',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-[var(--color-action)] text-white hover:bg-[var(--color-action-hover)] shadow-sm",
    secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 border border-zinc-200/60 dark:bg-zinc-800 dark:text-white dark:border-zinc-700 dark:hover:bg-zinc-700",
    outline: "bg-transparent border-2 border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600",
    danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[10px]",
    md: "px-4 py-2.5 text-xs",
    lg: "px-6 py-3 text-sm"
  };

  return (
    <motion.button 
      whileTap={{ scale: 0.97 }}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </motion.button>
  );
};
