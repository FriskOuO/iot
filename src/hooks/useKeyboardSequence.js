import { useEffect, useCallback, useRef } from 'react';

/**
 * useKeyboardSequence Hook
 * 
 * 處理 QTE 按鍵序列邏輯
 * 
 * @param {Array<string>} targetSequence - 目標按鍵序列（如 ['ArrowUp', 'ArrowDown']）
 * @param {Array<string>} currentSequence - 當前已輸入的序列
 * @param {Function} onKeyPress - 按鍵按下回調
 * @param {Function} onSuccess - 序列完成回調
 * @param {Function} onFail - 時間到期回調
 * @param {boolean} isActive - 是否啟用監聽
 * @param {number} timeLimit - 時間限制（毫秒）
 */
export const useKeyboardSequence = ({
  targetSequence = [],
  currentSequence = [],
  onKeyPress,
  onSuccess,
  onFail,
  isActive = false,
  timeLimit = 3000
}) => {
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // 檢查序列是否完成
  useEffect(() => {
    if (currentSequence.length > 0 && 
        currentSequence.length === targetSequence.length) {
      // 序列完成
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      onSuccess?.();
    }
  }, [currentSequence, targetSequence, onSuccess]);

  // 處理按鍵事件
  const handleKeyDown = useCallback((event) => {
    const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    
    if (!arrowKeys.includes(event.key)) {
      return;
    }

    event.preventDefault();
    
    const targetKey = targetSequence[currentSequence.length];
    
    if (event.key === targetKey) {
      // 正確按鍵
      onKeyPress?.(event.key);
    } else {
      // 錯誤按鍵，重置序列
      onKeyPress?.(event.key, true); // true 表示錯誤
    }
  }, [targetSequence, currentSequence, onKeyPress]);

  // 設置定時器
  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      return;
    }

    // 開始計時
    startTimeRef.current = Date.now();
    
    timerRef.current = setTimeout(() => {
      // 時間到，檢查是否完成
      if (currentSequence.length < targetSequence.length) {
        onFail?.();
      }
    }, timeLimit);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isActive, timeLimit, currentSequence.length, targetSequence, onFail]);

  // 監聽鍵盤事件
  useEffect(() => {
    if (!isActive) {
      return;
    }

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, handleKeyDown]);

  // 計算剩餘時間
  const getTimeLeft = useCallback(() => {
    if (!startTimeRef.current) return timeLimit / 1000;
    const elapsed = Date.now() - startTimeRef.current;
    const remaining = Math.max(0, timeLimit - elapsed) / 1000;
    return remaining;
  }, [timeLimit]);

  return {
    getTimeLeft
  };
};
