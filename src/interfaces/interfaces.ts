export const CATEGORIES = [
  'frontend',
  'backend',
  'companies',
  'dataAnalyst',
] as const;

export const LOCALES = ['en', 'es', 'fr'] as const;

export interface Lang {
  currentLocale: string;
}

export type { 
  InsertComment, 
  UserInputComment, 
  SelectComment 
} from '@/schemas/comments';

// Enums útiles
export enum CommentDirection {
  LEFT = 'left',
  BOTTOM = 'bottom'
}

// Tipo para la respuesta de la API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
}