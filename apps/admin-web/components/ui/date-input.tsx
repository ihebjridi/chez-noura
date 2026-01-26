'use client';

import React from 'react';
import { Input, InputProps } from './input';

export interface DateInputProps extends Omit<InputProps, 'type'> {}

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  (props, ref) => {
    return <Input type="date" ref={ref} {...props} />;
  }
);

DateInput.displayName = 'DateInput';
