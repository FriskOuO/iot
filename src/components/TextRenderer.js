import React from 'react';
import { useSelector } from '@xstate/react';

/**
 * TextRenderer Component
 * Parses text with {{variable}} syntax and replaces with live values from context
 */
const TextRenderer = ({ text, actor }) => {
  // Subscribe to all context updates
  const context = useSelector(actor, (state) => state.context);

  if (!text) return null;

  // Parse text for {{variable}} patterns
  const parts = text.split(/(\{\{[^}]+\}\})/g);

  return (
    <span>
      {parts.map((part, index) => {
        // Check if this part is a variable
        const match = part.match(/^\{\{([^}]+)\}\}$/);
        
        if (match) {
          const variableName = match[1].trim();
          const value = context[variableName];
          
          return (
            <span key={index} className="text-yellow-400 font-bold">
              {value !== undefined ? value : `{{${variableName}}}`}
            </span>
          );
        }
        
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

/**
 * NarrativeViewport Component
 * Displays scrollable narrative history with live variable support
 */
export const NarrativeViewport = ({ actor }) => {
  const narrativeHistory = useSelector(
    actor, 
    (state) => state.context.narrativeHistory
  );
  const scrollRef = React.useRef(null);

  // Auto-scroll to bottom when new narrative arrives
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [narrativeHistory]);

  return (
    <div 
      ref={scrollRef}
      className="h-full overflow-y-auto p-6 bg-slate-900 border-b-2 border-green-500"
      style={{ height: '70vh' }}
    >
      {narrativeHistory.length === 0 ? (
        <div className="text-zinc-400 text-center mt-10">
          <p className="text-2xl mb-2">🎮</p>
          <p>Initializing IoT Adventure...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {narrativeHistory.map((entry, index) => (
            <div 
              key={index}
              className="narrative-entry text-green-400 text-lg font-mono leading-relaxed"
            >
              <span className="text-zinc-400 text-sm mr-2">
                [{new Date(entry.timestamp).toLocaleTimeString()}]
              </span>
              <TextRenderer text={entry.text} actor={actor} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TextRenderer;
