export const API_URL = "/api";
export const BASE_URL = "";

export interface Employee {
  fullname: string;
  position: string;
  empCode?: string;
  company?: string;
  department?: string;
}

export interface EmployeeRecord {
  id: number;
  name: string;
  position: string;
  empCode?: string;
  company?: string;
  indication: string;
  signature: string | null;
  photo: string | null;
}

export interface IDField {
  id: string;
  label: string;
  value: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  underline?: boolean;
  fontFamily?: string;
  align: 'left' | 'center' | 'right';
  visible: boolean;
  w?: number;
  strokeColor?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  overlayBg?: string;
  overlayOpacity?: number;
}

export interface IDSide {
  background: string | null;
  fields: IDField[];
  photoX: number; photoY: number; photoW: number; photoH: number; showPhoto: boolean;
  photoStrokeWidth?: number; photoStrokeColor?: string;
  photoShadowBlur?: number; photoShadowColor?: string;
  photoOverlayColor?: string; photoOverlayOpacity?: number;
  photoBrightness?: number; photoContrast?: number;
  photoColorize?: boolean; photoColorizeColor?: string;
  sigX: number; sigY: number; sigW: number; sigH: number; showSig: boolean;
  sigStrokeWidth?: number; sigStrokeColor?: string;
  sigShadowBlur?: number; sigShadowColor?: string;
  sigBrightness?: number; sigContrast?: number;
  sigColorize?: boolean; sigColorizeColor?: string; sigInkDark?: boolean;
}

export interface IDTemplate {
  id: string;
  name: string;
  company?: string;
  createdAt?: string;
  front: IDSide;
  back: IDSide;
}

export type ActiveSection = 'home' | 'dashboard' | 'add' | 'database' | 'idbuilder' | 'idrecords';

export interface EditingID {
  id: string;
  employeeName: string;
  position: string;
  front: IDSide;
  back: IDSide;
}