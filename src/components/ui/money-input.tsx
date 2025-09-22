'use client'

import { forwardRef, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";

interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number;
  onChange: (value: number) => void;
  showCurrency?: boolean;
  allowNegative?: boolean;
  maxValue?: number;
  minValue?: number;
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  ({
    value,
    onChange,
    showCurrency = true,
    allowNegative = false,
    maxValue,
    minValue = 0,
    className,
    placeholder = "0",
    ...props
  }, ref) => {
    const [displayValue, setDisplayValue] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    // 숫자를 표시용 문자열로 변환
    const formatForDisplay = (num: number) => {
      if (num === 0) return "";
      if (showCurrency) {
        return formatCurrency(num).replace('₩', '').trim();
      }
      return num.toLocaleString('ko-KR');
    };

    // 표시값을 숫자로 변환
    const parseDisplayValue = (str: string): number => {
      const cleanStr = str.replace(/[^\d.-]/g, '');
      const num = parseFloat(cleanStr) || 0;

      // 음수 처리
      if (!allowNegative && num < 0) return 0;

      // 최소/최대값 처리
      if (minValue !== undefined && num < minValue) return minValue;
      if (maxValue !== undefined && num > maxValue) return maxValue;

      return num;
    };

    // value prop이 변경되면 displayValue 업데이트
    useEffect(() => {
      if (!isFocused) {
        setDisplayValue(formatForDisplay(value));
      }
    }, [value, isFocused, showCurrency]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      // 포커스 시 숫자만 표시 (콤마 없이)
      setDisplayValue(value === 0 ? "" : value.toString());
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      const newValue = parseDisplayValue(displayValue);
      onChange(newValue);
      setDisplayValue(formatForDisplay(newValue));
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      if (isFocused) {
        // 포커스 중에는 숫자와 특수문자만 허용
        const allowedChars = allowNegative ? /[0-9.-]/ : /[0-9.]/;
        const cleanValue = inputValue.split('').filter(char => allowedChars.test(char)).join('');
        setDisplayValue(cleanValue);
      } else {
        setDisplayValue(inputValue);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // 방향키, 백스페이스, 델리트, 탭, 엔터 허용
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) {
        props.onKeyDown?.(e);
        return;
      }

      // 숫자와 소수점 허용
      if (/[0-9.]/.test(e.key)) {
        // 소수점 중복 방지
        if (e.key === '.' && displayValue.includes('.')) {
          e.preventDefault();
          return;
        }
        props.onKeyDown?.(e);
        return;
      }

      // 음수 허용 시 마이너스 기호 허용 (맨 앞에서만)
      if (allowNegative && e.key === '-' && e.currentTarget.selectionStart === 0) {
        props.onKeyDown?.(e);
        return;
      }

      // Ctrl/Cmd + A, C, V, Z 허용
      if (e.ctrlKey || e.metaKey) {
        if (['a', 'c', 'v', 'z'].includes(e.key.toLowerCase())) {
          props.onKeyDown?.(e);
          return;
        }
      }

      // 나머지 키는 차단
      e.preventDefault();
    };

    return (
      <div className="relative">
        {showCurrency && !isFocused && value > 0 && (
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
            ₩
          </span>
        )}
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "font-mono text-right",
            showCurrency && !isFocused && value > 0 && "pl-8",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

MoneyInput.displayName = "MoneyInput";