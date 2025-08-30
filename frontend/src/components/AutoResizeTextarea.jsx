import { useEffect, useRef } from "react";

function AutoResizeTextarea({ value, onChange, placeholder, disabled, className }) {
  const ref = useRef(null);

  const autoResize = () => {
    if (!ref.current) return;
    ref.current.style.height = "auto"; 
    ref.current.style.height = `${ref.current.scrollHeight}px`;
  };

  useEffect(() => {
    autoResize();
  }, [value]);

  return (
    <textarea
      ref={ref}
      className={className}
      value={value}
      onChange={onChange}
      onInput={autoResize}
      placeholder={placeholder}
      disabled={disabled}
      rows={1}
    />
  );
}

export default AutoResizeTextarea;
