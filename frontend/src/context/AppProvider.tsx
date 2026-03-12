import React, { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';

interface Props {
  children: ReactNode;
}

export const AppProvider = ({ children }: Props) => {
  return <AuthProvider>{children}</AuthProvider>;
};