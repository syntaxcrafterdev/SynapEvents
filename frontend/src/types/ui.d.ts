// This file helps TypeScript understand the UI components
// It's a temporary solution until we properly install all dependencies

declare module '@/components/ui/input' {
  import { InputHTMLAttributes } from 'react';
  
  export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}
  
  const Input: React.ForwardRefExoticComponent<
    InputProps & React.RefAttributes<HTMLInputElement>
  >;
  
  export { Input };
}

declare module '@/components/ui/card' {
  import { HTMLAttributes } from 'react';
  
  interface CardProps extends HTMLAttributes<HTMLDivElement> {}
  interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}
  interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}
  interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}
  interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}
  interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}
  
  export const Card: React.FC<CardProps>;
  export const CardHeader: React.FC<CardHeaderProps>;
  export const CardTitle: React.FC<CardTitleProps>;
  export const CardDescription: React.FC<CardDescriptionProps>;
  export const CardContent: React.FC<CardContentProps>;
  export const CardFooter: React.FC<CardFooterProps>;
}

declare module '@/components/ui/label' {
  import { LabelHTMLAttributes } from 'react';
  
  export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}
  
  const Label: React.ForwardRefExoticComponent<
    LabelProps & React.RefAttributes<HTMLLabelElement>
  >;
  
  export { Label };
}

declare module '@/components/theme-toggle' {
  import { FC } from 'react';
  
  export const ThemeToggle: FC<{}>;
}
